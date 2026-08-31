import { QuizModel, IQuizDocument, IParticipantDoc } from '../models/Quiz';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { parseCsvBuffer } from '../utils/csv';
import { csvParticipantRowSchema } from '../schemas/instructor.schema';
import type {
  Participant,
  BulkUploadResult,
  CsvRowError,
} from '../types/quiz';
import type { AddParticipantInput, CsvParticipantRow } from '../schemas/instructor.schema';

/**
 * Participant service for instructors.
 *
 * - Manual add by email: validates the email belongs to a registered
 *   user with the 'candidate' role. Idempotent (duplicate emails are
 *   skipped cleanly). Records `addedAt` timestamp.
 * - CSV bulk upload: atomic — all rows validated before any insertion.
 * - Remove: allowed only before the quiz goes Live.
 */

/** Convert a participant subdoc to a public Participant object. */
function toParticipant(p: IParticipantDoc): Participant {
  return {
    id: p._id.toString(),
    userId: p.userId.toString(),
    email: p.email,
    name: p.name,
    addedAt: p.addedAt instanceof Date ? p.addedAt.toISOString() : String(p.addedAt),
  };
}

/** Look up a candidate user by email. Returns null if not found or not a candidate. */
async function findCandidateByEmail(email: string): Promise<{
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
} | null> {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('-password')
    .lean()
    .exec();
  if (!user) return null;
  if (user.role !== 'candidate') return null;
  return user as { _id: { toString(): string }; name: string; email: string; role: string };
}

/** Add a single participant by email. Idempotent for duplicates. */
export async function addParticipant(
  quiz: IQuizDocument,
  input: AddParticipantInput,
): Promise<{ participant: Participant | null; alreadyAssigned: boolean }> {
  if (!quiz.isEditable()) {
    throw AppError.conflict(
      `Participants can only be added to Draft or Scheduled quizzes. Current status: '${quiz.status}'.`,
    );
  }

  // Validate the email belongs to a registered candidate.
  const candidate = await findCandidateByEmail(input.email);
  if (!candidate) {
    throw AppError.notFound(
      `No registered candidate found with email ${input.email}`,
    );
  }

  // Idempotent: skip if already assigned.
  const existing = (quiz.participants ?? []).find(
    (p) => p.userId.toString() === candidate._id.toString(),
  );
  if (existing) {
    return { participant: toParticipant(existing), alreadyAssigned: true };
  }

  const newParticipant: IParticipantDoc = {
    _id: new (QuizModel.db as unknown as { Types: { ObjectId: new () => import('mongoose').Types.ObjectId } }).Types.ObjectId() as unknown as import('mongoose').Types.ObjectId,
    userId: candidate._id as unknown as import('mongoose').Types.ObjectId,
    email: candidate.email,
    name: candidate.name,
    addedAt: new Date(),
  };

  quiz.participants.push(newParticipant);
  await quiz.save();
  return { participant: toParticipant(newParticipant), alreadyAssigned: false };
}

/** Remove a participant. Allowed only before the quiz goes Live. */
export async function removeParticipant(
  quiz: IQuizDocument,
  participantId: string,
): Promise<void> {
  // Removal is allowed only before the quiz goes Live (i.e., Draft or Scheduled).
  if (quiz.status === 'live' || quiz.status === 'completed') {
    throw AppError.conflict(
      `Participants cannot be removed once the quiz is ${quiz.status}.`,
    );
  }

  const index = (quiz.participants ?? []).findIndex(
    (p) => p._id.toString() === participantId,
  );
  if (index === -1) {
    throw AppError.notFound('Participant not found');
  }

  quiz.participants.splice(index, 1);
  await quiz.save();
}

/** List all participants in a quiz. */
export async function listParticipants(quiz: IQuizDocument): Promise<Participant[]> {
  return (quiz.participants ?? []).map(toParticipant);
}

/**
 * Atomic CSV bulk upload of participants.
 *
 * Parses and validates every row, then verifies each email belongs to a
 * registered candidate. Only if ALL rows pass both CSV and candidate
 * validation are participants appended. Duplicates (within the file or
 * already assigned) are skipped cleanly and reported.
 */
export async function bulkUploadParticipants(
  quiz: IQuizDocument,
  csvBuffer: Buffer,
): Promise<BulkUploadResult<Participant>> {
  if (!quiz.isEditable()) {
    throw AppError.conflict(
      `Participants can only be bulk-uploaded to Draft or Scheduled quizzes. Current status: '${quiz.status}'.`,
    );
  }

  // Parse CSV.
  let rawRows: Record<string, string>[];
  try {
    rawRows = await parseCsvBuffer(csvBuffer);
  } catch (err) {
    throw AppError.badRequest('Failed to parse CSV file', (err as Error).message);
  }

  if (rawRows.length === 0) {
    throw AppError.badRequest('CSV file is empty or has no data rows');
  }

  // Phase 1: validate CSV row shapes.
  const errors: CsvRowError[] = [];
  const validRows: CsvParticipantRow[] = [];

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 2;
    const result = csvParticipantRowSchema.safeParse(raw);
    if (result.success) {
      validRows.push(result.data);
    } else {
      const messages = result.error.issues.map((i) => i.message).join('; ');
      errors.push({ row: rowNumber, message: messages });
    }
  });

  if (errors.length > 0) {
    return { inserted: 0, skipped: rawRows.length, errors, items: [] };
  }

  // Phase 2: verify each email belongs to a registered candidate.
  // Deduplicate emails within the file first.
  const uniqueEmails = Array.from(new Set(validRows.map((r) => r.email)));
  const candidates = await Promise.all(
    uniqueEmails.map((email) => findCandidateByEmail(email)),
  );

  const candidateMap = new Map<string, { _id: { toString(): string }; name: string; email: string }>();
  const candidateErrors: CsvRowError[] = [];

  uniqueEmails.forEach((email, idx) => {
    const candidate = candidates[idx];
    if (!candidate) {
      // Find all rows with this email to report errors.
      validRows.forEach((row, rowIdx) => {
        if (row.email === email) {
          candidateErrors.push({
            row: rowIdx + 2,
            message: `No registered candidate found with email ${email}`,
          });
        }
      });
    } else {
      candidateMap.set(email, { _id: candidate._id, name: candidate.name, email: candidate.email });
    }
  });

  // Atomic: if any email is not a valid candidate, reject the entire upload.
  if (candidateErrors.length > 0) {
    return { inserted: 0, skipped: rawRows.length, errors: candidateErrors, items: [] };
  }

  // Phase 3: build participant subdocs, skipping duplicates idempotently.
  const existingIds = new Set(
    (quiz.participants ?? []).map((p) => p.userId.toString()),
  );
  const seenInBatch = new Set<string>();
  const newParticipants: IParticipantDoc[] = [];
  let skipped = 0;

  for (const row of validRows) {
    const candidate = candidateMap.get(row.email);
    if (!candidate) continue; // should not happen after validation
    const userIdStr = candidate._id.toString();
    if (existingIds.has(userIdStr) || seenInBatch.has(userIdStr)) {
      skipped++;
      continue;
    }
    seenInBatch.add(userIdStr);
    newParticipants.push({
      _id: new (QuizModel.db as unknown as { Types: { ObjectId: new () => import('mongoose').Types.ObjectId } }).Types.ObjectId() as unknown as import('mongoose').Types.ObjectId,
      userId: candidate._id as unknown as import('mongoose').Types.ObjectId,
      email: candidate.email,
      name: candidate.name,
      addedAt: new Date(),
    });
  }

  if (newParticipants.length > 0) {
    quiz.participants.push(...newParticipants);
    await quiz.save();
  }

  return {
    inserted: newParticipants.length,
    skipped,
    errors: [],
    items: newParticipants.map(toParticipant),
  };
}
