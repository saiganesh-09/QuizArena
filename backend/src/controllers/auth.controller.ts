import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { signupUser, loginUser, getProfileById } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import {
  buildAuthCookieOptions,
  buildClearAuthCookieOptions,
} from '../utils/cookie';
import type { ApiSuccessBody } from '../types/auth';
import type { UserProfile } from '../types/auth';
import type { SignupInput, LoginInput } from '../schemas/auth.schema';

/**
 * Auth controllers. Each is kept thin: validation is done by middleware,
 * business logic lives in the service layer.
 */

/** POST /auth/signup */
export function signup(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const input = req.body as SignupInput;
      const { user, token, maxAgeSeconds } = await signupUser(input);

      // Issue JWT in an HTTP-only, Secure, SameSite cookie.
      res.cookie(config.jwt.cookieName, token, buildAuthCookieOptions(maxAgeSeconds));

      const body: ApiSuccessBody<UserProfile> = { success: true, data: user };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /auth/login */
export function login(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const input = req.body as LoginInput;
      const { user, token, maxAgeSeconds } = await loginUser(input);

      res.cookie(config.jwt.cookieName, token, buildAuthCookieOptions(maxAgeSeconds));

      const body: ApiSuccessBody<UserProfile> = { success: true, data: user };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /auth/logout — idempotent cookie clear. */
export function logout(_req: Request, res: Response, _next: NextFunction): void {
  // Always clear the cookie with the same name/path and an expiry in the
  // past, so calling logout when already logged out is a no-op (idempotent).
  res.clearCookie(config.jwt.cookieName, buildClearAuthCookieOptions());

  const body: ApiSuccessBody<null> = { success: true, data: null };
  res.status(200).json(body);
}

/** GET /auth/me — return the current user's profile. */
export function me(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) {
        throw AppError.unauthorized('Unauthorized');
      }
      const profile = await getProfileById(req.user.sub);
      const body: ApiSuccessBody<UserProfile> = { success: true, data: profile };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}
