// Seed #4: more homework + more submitted attempts for richer pages.
// Run: MONGO_URI=<atlas-uri> node seed-prod-4.mjs
import mongoose from 'mongoose';

const API = 'https://quizarena-api-olive.vercel.app';
const ORIGIN = 'https://quizarena-hazel.vercel.app';
const PW = 'Password123!';
const jar = {};

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
  if (r.status !== 200) throw new Error(`login ${email}: ${r.status}`);
}

// ---- helpers ----
function mkQuestion(text, options, correctIdx = 0) {
  return {
    _id: new mongoose.Types.ObjectId(),
    type: 'single-choice',
    text,
    options: options.map((t, i) => ({ id: `opt-${i + 1}`, text: t })),
    correctOptionIds: [`opt-${correctIdx + 1}`],
    points: 1,
  };
}

function mkAttempt({ quiz, user, correctCount, minutesAgo, teacherRemark = '' }) {
  const answers = quiz.questions.map((q, i) => {
    const correct = i < correctCount;
    return {
      questionId: q._id,
      selectedOptionIds: correct ? q.correctOptionIds : [q.options.find((o) => !q.correctOptionIds.includes(o.id))?.id ?? q.correctOptionIds[0]],
      awardedPoints: correct ? q.points : 0,
      maxPoints: q.points,
      isCorrect: correct,
    };
  });
  const maxScore = quiz.questions.reduce((s, q) => s + q.points, 0);
  const submitted = new Date(Date.now() - minutesAgo * 60000);
  return {
    quizId: quiz._id,
    quizTitle: quiz.title,
    candidateId: user._id,
    status: 'submitted',
    startedAt: new Date(submitted.getTime() - 8 * 60000),
    submittedAt: submitted,
    deadlineAt: quiz.endTime,
    durationMinutes: quiz.durationMinutes,
    answers,
    score: answers.reduce((s, a) => s + a.awardedPoints, 0),
    maxScore,
    scoreOverride: null,
    teacherRemark,
    autoSubmitted: false,
    createdAt: submitted,
    updatedAt: submitted,
  };
}

const SCI_QS = [
  ['What planet is known as the Red Planet?', ['Mars', 'Venus', 'Jupiter', 'Saturn']],
  ['What gas do plants absorb?', ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen']],
  ['Water boils at what temperature (°C)?', ['100', '90', '80', '120']],
  ['Which organ pumps blood?', ['Heart', 'Liver', 'Lung', 'Kidney']],
  ['What is H2O?', ['Water', 'Hydrogen', 'Oxygen', 'Salt']],
  ['Fastest land animal?', ['Cheetah', 'Lion', 'Horse', 'Tiger']],
  ['How many bones in an adult human body?', ['206', '106', '306', '186']],
  ['Which planet has rings?', ['Saturn', 'Mars', 'Mercury', 'Venus']],
  ['What force pulls objects to Earth?', ['Gravity', 'Magnetism', 'Friction', 'Inertia']],
  ['What does DNA stand for?', ['Deoxyribonucleic acid', 'Dinucleic acid', 'Dual nucleic acid', 'Deoxy nucleic atom']],
];
const ENG_QS = [
  ['Synonym of "happy"?', ['Joyful', 'Sad', 'Angry', 'Tired']],
  ['Antonym of "begin"?', ['End', 'Start', 'Open', 'Go']],
  ['Plural of "child"?', ['Children', 'Childs', 'Childes', 'Childrens']],
  ['"Break a leg" means?', ['Good luck', 'Get hurt', 'Run fast', 'Be careful']],
  ['Synonym of "big"?', ['Large', 'Tiny', 'Narrow', 'Thin']],
  ['A group of stars is called?', ['Constellation', 'Galaxy bunch', 'Star pack', 'Cluster of suns']],
  ['Opposite of "ancient"?', ['Modern', 'Old', 'Antique', 'Classic']],
  ['"Piece of cake" means?', ['Very easy', 'Tasty food', 'Hard work', 'Party time']],
  ['Correct spelling?', ['Necessary', 'Neccessary', 'Necesary', 'Necessery']],
  ['Which is a verb?', ['Run', 'Blue', 'Chair', 'Happily']],
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection;
  const usersCol = db.collection('users');
  const quizzesCol = db.collection('quizzes');
  const attemptsCol = db.collection('attempts');
  console.log('connected');

  const users = await usersCol.find({ role: 'candidate' }).toArray();
  const byEmail = new Map(users.map((u) => [u.email, u]));
  const teacher = await usersCol.findOne({ email: 'teacher@quiz.com' });
  const sai = byEmail.get('saiganeshkenguva@gmail.com');
  const pick = (emails) => emails.map((e) => byEmail.get(e)).filter(Boolean)
    .map((u) => ({ userId: u._id, email: u.email, name: u.name, addedAt: new Date() }));
  const students = pick(['saiganeshkenguva@gmail.com', 'candidate@quiz.com', 'alice@quiz.com', 'bob@quiz.com', 'carol@quiz.com', 'david@quiz.com', 'emma@quiz.com']);

  // 1) Yesterday's homework — completed, with Sai + others' attempts (direct DB)
  const yStart = new Date(); yStart.setUTCDate(yStart.getUTCDate() - 1); yStart.setUTCHours(8, 0, 0, 0);
  const yEnd = new Date(yStart); yEnd.setUTCHours(23, 59, 59, 999);
  const hw1 = {
    title: 'Daily Science Practice — 2026-10-05',
    description: 'Daily homework: 10 science questions.',
    status: 'completed', kind: 'homework',
    startTime: yStart, endTime: yEnd, durationMinutes: 20,
    level: 'Beginner', difficulty: 'Easy', passingPoints: 0,
    createdBy: teacher._id,
    instructors: [{ instructorId: teacher._id, instructorEmail: 'teacher@quiz.com', assignedAt: yStart }],
    questions: SCI_QS.map(([t, o]) => mkQuestion(t, o)),
    participants: students, cancelledAt: null,
    createdAt: yStart, updatedAt: yStart,
  };
  const hw1res = await quizzesCol.insertOne(hw1);
  hw1._id = hw1res.insertedId;
  console.log('past homework:', hw1._id.toString());

  const HW1_SCORES = { 'saiganeshkenguva@gmail.com': [8, ''], 'alice@quiz.com': [9, 'Excellent focus'], 'bob@quiz.com': [5, ''], 'candidate@quiz.com': [10, ''], 'emma@quiz.com': [10, ''], 'carol@quiz.com': [4, 'Needs more practice on physics basics'] };
  for (const [email, [correct, remark]] of Object.entries(HW1_SCORES)) {
    const u = byEmail.get(email);
    if (!u) continue;
    await attemptsCol.insertOne(mkAttempt({ quiz: hw1, user: u, correctCount: correct, minutesAgo: 1500, teacherRemark: remark }));
  }
  console.log('past homework attempts: 6');

  // 2) Sai's attempt on JavaScript Fundamentals + today's math homework (DB)
  const jsQuiz = await quizzesCol.findOne({ title: 'JavaScript Fundamentals' });
  const mathHw = await quizzesCol.findOne({ title: /^Daily Math Practice/ });
  if (jsQuiz && sai) {
    const exists = await attemptsCol.findOne({ quizId: jsQuiz._id, candidateId: sai._id });
    if (!exists) {
      await attemptsCol.insertOne(mkAttempt({ quiz: jsQuiz, user: sai, correctCount: 7, minutesAgo: 2900, teacherRemark: 'Good work — review array methods' }));
      console.log('sai JS attempt: 7/10');
    }
  }
  if (mathHw && sai) {
    const exists = await attemptsCol.findOne({ quizId: mathHw._id, candidateId: sai._id });
    if (!exists) {
      await attemptsCol.insertOne(mkAttempt({ quiz: mathHw, user: sai, correctCount: 8, minutesAgo: 1300, teacherRemark: 'Solid! Watch out for factorials' }));
      console.log('sai math hw attempt: 8/10');
    }
  }

  // 3) Today's homework via API — "Daily English Practice" (teacher creates, publishes live)
  await login('teacher@quiz.com', 'teacher');
  const start = new Date();
  const end = new Date(); end.setUTCHours(23, 59, 59, 999);
  const create = await call('POST', '/instructor/quizzes', {
    title: 'Daily English Practice — 2026-10-06',
    description: 'Daily homework: 10 vocabulary & grammar questions. Due end of day.',
    startTime: start.toISOString(), endTime: end.toISOString(),
    durationMinutes: 15, kind: 'homework',
  }, 'teacher');
  if (create.status !== 201) throw new Error(`create: ${create.status} ${JSON.stringify(create.data)}`);
  const hw2 = create.data.data.id;
  for (const [t, o] of ENG_QS) {
    const q = mkQuestion(t, o);
    const r = await call('POST', `/instructor/quizzes/${hw2}/questions`, {
      type: q.type, text: q.text, options: q.options, correctOptionIds: q.correctOptionIds, points: 1,
    }, 'teacher');
    if (r.status !== 201) throw new Error(`q: ${r.status} ${JSON.stringify(r.data)}`);
  }
  for (const p of students) {
    await call('POST', `/instructor/quizzes/${hw2}/participants`, { email: p.email }, 'teacher');
  }
  const pub = await call('POST', `/instructor/quizzes/${hw2}/publish`, null, 'teacher');
  console.log('english homework published:', pub.status, pub.data?.data?.status);

  // 4) A couple of demo candidates submit today's homework via API
  for (const [email, correctIdx] of [['alice@quiz.com', 9], ['bob@quiz.com', 6], ['emma@quiz.com', 10]]) {
    const role = `c_${email}`;
    await login(email, role);
    const s = await call('POST', `/candidate/quizzes/${hw2}/start`, null, role);
    if (s.status !== 200 && s.status !== 201) { console.log(`  start ${email}: ${s.status}`); continue; }
    const attempt = s.data.data;
    // answer: correct for first `correctIdx` questions, wrong after
    const answers = attempt.questions.map((q, i) => ({
      questionId: q.id,
      selectedOptionIds: i < correctIdx ? ['opt-1'] : ['opt-2'],
    }));
    const sub = await call('POST', `/candidate/quizzes/${hw2}/submit`, { answers }, role);
    console.log(`  ${email}: submit ${sub.status} score ${sub.data?.data?.score}/${sub.data?.data?.maxScore}`);
  }

  await mongoose.disconnect();
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
