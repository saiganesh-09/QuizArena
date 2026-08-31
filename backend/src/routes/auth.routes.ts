import { Router } from 'express';
import { signup, login, logout, me } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { signupSchema, loginSchema } from '../schemas/auth.schema';

/**
 * Auth routes.
 * All paths are mounted under /auth (see app.ts).
 */
const router = Router();

// Public routes
router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout); // idempotent; works whether or not authenticated

// Protected routes
router.get('/me', requireAuth, me);

export default router;
