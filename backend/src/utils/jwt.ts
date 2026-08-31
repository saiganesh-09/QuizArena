import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { JwtPayload, UserRole } from '../types/auth';

/**
 * JWT helpers. Tokens are only ever sent via HTTP-only cookies and are
 * never returned in response bodies.
 */

/** Sign a JWT for a given user id/email/role. */
export function signToken(payload: {
  sub: string;
  email: string;
  role: UserRole;
}): string {
  return jwt.sign(payload, config.jwt.secret, {
    // Cast to the StringValue type expected by @types/jsonwebtoken.
    expiresIn: config.jwt.expiresIn as unknown as number,
  });
}

/** Verify a JWT and return its typed payload, or null if invalid/expired. */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
