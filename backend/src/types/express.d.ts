import type { JwtPayload } from '../types/auth';

/**
 * Augment Express's Request with the authenticated user attached by
 * the requireAuth middleware. This keeps strict typing end-to-end.
 *
 * NOTE: Runtime helpers (like isUserRole) live in `types/express.ts`
 * since `.d.ts` files can only contain type declarations, not runtime
 * values that can be imported at runtime by ts-node.
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
    loadedQuiz?: import('../models/Quiz').IQuizDocument;
  }
}
