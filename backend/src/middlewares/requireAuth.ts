import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import type { UserRole } from '../types/auth';
import { isUserRole } from '../types/userRole';

/**
 * requireAuth: parses the JWT cookie, verifies it, and attaches
 * req.user. Rejects with 401 if missing/invalid.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[config.jwt.cookieName] as string | undefined;

  if (!token) {
    return next(AppError.unauthorized('Authentication required'));
  }

  const payload = verifyToken(token);
  if (!payload || !isUserRole(payload.role)) {
    return next(AppError.unauthorized('Invalid or expired session'));
  }

  req.user = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role as UserRole,
    iat: payload.iat,
    exp: payload.exp,
  };

  next();
}

/**
 * requireRole: role-based guard used AFTER requireAuth.
 * Usage: router.get('/x', requireAuth, requireRole('admin'), handler)
 *
 * Because requireAuth has already verified the JWT and attached req.user,
 * a missing req.user here is treated as 401, but an authenticated user
 * whose role is not permitted gets 403 Forbidden (not 401). The role is
 * read strictly from the verified JWT payload — never from client-supplied
 * headers or body fields.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient permissions'));
    }
    next();
  };
}
