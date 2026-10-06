import mongoose from 'mongoose';
import { QuizModel } from '../models/Quiz';
import { User } from '../models/User';
import { AttemptModel } from '../models/Attempt';
import type { InstructorStudent, AttemptStatus } from '../types/quiz';

const SUBMITTED: AttemptStatus[] = ['submitted', 'auto-submitted'];

/**
 * Roster of all students assigned to the calling instructor's quizzes,
 * with per-student submission stats. Scoped strictly to quizzes owned
 * by the instructor — never leaks other instructors' participants.
 */
export async function listInstructorStudents(
  instructorId: string,
): Promise<InstructorStudent[]> {
  const quizzes = await QuizModel.find({
    'instructors.instructorId': instructorId,
  })
    .select('_id participants')
    .exec();

  // Count assignments per candidate across this instructor's quizzes.
  const assigned = new Map<string, number>();
  for (const q of quizzes) {
    for (const p of q.participants ?? []) {
      const id = p.userId.toString();
      assigned.set(id, (assigned.get(id) ?? 0) + 1);
    }
  }
  if (assigned.size === 0) return [];

  const quizIds = quizzes.map((q) => q._id);
  const attempts = await AttemptModel.find({
    quizId: { $in: quizIds },
    status: { $in: SUBMITTED },
  })
    .select('candidateId score scoreOverride maxScore')
    .exec();

  const stats = new Map<string, { count: number; pcts: number[] }>();
  for (const a of attempts) {
    const id = a.candidateId.toString();
    const score = a.scoreOverride ?? a.score;
    const pct = a.maxScore > 0 ? (score / a.maxScore) * 100 : 0;
    const s = stats.get(id) ?? { count: 0, pcts: [] };
    s.count += 1;
    s.pcts.push(pct);
    stats.set(id, s);
  }

  const users = await User.find({
    _id: { $in: [...assigned.keys()].map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select('name email')
    .exec();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return [...assigned.entries()]
    .map(([candidateId, quizzesAssigned]) => {
      const u = userMap.get(candidateId);
      const s = stats.get(candidateId);
      return {
        candidateId,
        name: u?.name ?? 'Unknown',
        email: u?.email ?? '',
        quizzesAssigned,
        submittedCount: s?.count ?? 0,
        averagePercentage: s ? Math.round(s.pcts.reduce((t, p) => t + p, 0) / s.pcts.length) : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
