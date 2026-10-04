// Seed: teacher account + today's homework assignment (10 questions).
// Run: node seed-prod-3.mjs   (reads MONGO_URI from backend/.env)
import 'dotenv/config';
import mongoose from 'mongoose';

const API = 'https://quizarena-api-olive.vercel.app';
const ORIGIN = 'https://quizarena-hazel.vercel.app';
const PW = 'Password123!';

const jar = {}; // role -> cookie
async function call(method, path, body, role) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      ...(jar[role] ? { Cookie: jar[role] } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const cookie = res.headers.get('set-cookie');
  if (role && cookie) jar[role] = cookie.split(';')[0];
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(email, role) {
  const r = await call('POST', '/auth/login', { email, password: PW }, role);
  if (r.status !== 200) throw new Error(`login ${email}: ${r.status} ${JSON.stringify(r.data)}`);
  console.log(`  logged in ${email}`);
}

async function ensureUser(email, name, role) {
  const s = await call('POST', '/auth/signup', { name, email, password: PW });
  if (s.status === 201) console.log(`  created ${email}`);
  else if (s.status !== 409) console.log(`  signup ${email}: ${s.status} ${JSON.stringify(s.data)}`);
  if (role !== 'candidate') {
    const col = mongoose.connection.collection('users');
    await col.updateOne({ email }, { $set: { role } });
    console.log(`  ${email} -> ${role}`);
  }
}

const HW_QUESTIONS = [
  'What is 15 × 8?', 'Simplify: 24 ÷ 6 + 3 × 4', 'What is the square root of 144?',
  'Solve for x: 2x + 6 = 20', 'What is 7! (7 factorial)?', 'What is 20% of 250?',
  'Convert 0.75 to a fraction', 'What is the perimeter of a square with side 9 cm?',
  'What is 3³ (3 cubed)?', 'Solve: 100 − 45 + 15',
];
const HW_OPTIONS = [
  ['120', '110', '128', '115'], ['18', '16', '20', '14'], ['12', '14', '16', '11'],
  ['7', '8', '6', '9'], ['5040', '720', '840', '2520'], ['50', '45', '55', '40'],
  ['3/4', '7/10', '4/5', '2/3'], ['36 cm', '32 cm', '40 cm', '45 cm'],
  ['27', '9', '18', '81'], ['70', '65', '75', '60'],
];
const HW_CORRECT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('connected to', mongoose.connection.name);

  // 1) Teacher account
  await ensureUser('teacher@quiz.com', 'Teacher Patel', 'instructor');
  await login('teacher@quiz.com', 'teacher');

  // 2) Create today's homework (kind=homework, window: now -> end of day)
  const start = new Date();
  const end = new Date(); end.setUTCHours(23, 59, 59, 999);
  const create = await call('POST', '/instructor/quizzes', {
    title: `Daily Math Practice — ${start.toISOString().slice(0, 10)}`,
    description: 'Daily homework: 10 arithmetic questions. Due end of day.',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMinutes: 20,
    kind: 'homework',
  }, 'teacher');
  if (create.status !== 201) throw new Error(`create homework: ${create.status} ${JSON.stringify(create.data)}`);
  const hwId = create.data.data.id;
  console.log('  homework draft:', hwId);

  // 3) Add 10 questions
  for (let i = 0; i < HW_QUESTIONS.length; i++) {
    const options = HW_OPTIONS[i].map((t, j) => ({ id: `opt-${j + 1}`, text: t }));
    const r = await call('POST', `/instructor/quizzes/${hwId}/questions`, {
      type: 'single-choice',
      text: HW_QUESTIONS[i],
      options,
      correctOptionIds: [options[HW_CORRECT[i]].id],
      points: 1,
    }, 'teacher');
    if (r.status !== 201) throw new Error(`question ${i + 1}: ${r.status} ${JSON.stringify(r.data)}`);
  }
  console.log('  10 questions added');

  // 4) Participants (all candidates)
  const students = ['saiganeshkenguva@gmail.com', 'candidate@quiz.com', 'alice@quiz.com', 'bob@quiz.com', 'carol@quiz.com', 'david@quiz.com', 'emma@quiz.com'];
  for (const email of students) {
    const r = await call('POST', `/instructor/quizzes/${hwId}/participants`, { email }, 'teacher');
    if (r.status !== 201 && r.status !== 200) console.log(`  participant ${email}: ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  }
  console.log('  participants added');

  // 5) Publish (min-10 rule + open window)
  const pub = await call('POST', `/instructor/quizzes/${hwId}/publish`, null, 'teacher');
  console.log('  publish:', pub.status, pub.data?.data?.status ?? JSON.stringify(pub.data).slice(0, 200));

  // 6) Verify: candidate sees it under kind=homework
  await login('candidate@quiz.com', 'cand');
  const list = await call('GET', '/candidate/quizzes?kind=homework', null, 'cand');
  console.log('  candidate homework list:', list.status, JSON.stringify(list.data?.data?.items?.map((i) => `${i.title} [${i.status}]`) ?? list.data));

  // 7) Verify grade endpoint on an existing submitted attempt
  await login('instructor@quiz.com', 'inst');
  const results = await call('GET', '/instructor/quizzes', null, 'inst');
  const quizzes = results.data?.data?.items ?? [];
  const jsQuiz = quizzes.find((q) => q.title === 'JavaScript Fundamentals');
  if (jsQuiz) {
    const rows = await call('GET', `/instructor/quizzes/${jsQuiz.id}/results`, null, 'inst');
    const bob = rows.data?.data?.candidates?.find((r) => r.candidateName.includes('Bob'));
    if (bob) {
      const g = await call('PATCH', `/instructor/quizzes/${jsQuiz.id}/results/${bob.attemptId}/grade`, {
        score: 8, teacherRemark: 'Improved after review — good job Bob!',
      }, 'inst');
      console.log('  grade Bob:', g.status, g.data?.data ? `score ${g.data.data.score}/${g.data.data.maxScore} remark "${g.data.data.teacherRemark}" rank #${g.data.data.rank}` : JSON.stringify(g.data));
    } else console.log('  Bob attempt not found');
  }

  await mongoose.disconnect();
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
