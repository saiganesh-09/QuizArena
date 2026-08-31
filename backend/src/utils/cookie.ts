import type { CookieOptions } from 'express';
import { config } from '../config';

/**
 * Cookie configuration for the auth JWT.
 * - httpOnly: not accessible from JS (prevents XSS token theft)
 * - secure: only sent over HTTPS in production
 * - sameSite: mitigates CSRF
 * - signed: the JWT itself is signed, so the cookie value is tamper-proof
 */
export function buildAuthCookieOptions(maxAgeSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  };
}

/** Cookie options used to clear (expire) the auth cookie idempotently. */
export function buildClearAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: '/',
    maxAge: 0, // expire immediately
    expires: new Date(0), // ensure expiry in the past
  };
}

/** Parse the configured JWT_EXPIRES_IN (e.g. "1d", "3600s") into seconds. */
export function jwtExpirySeconds(): number {
  const raw = config.jwt.expiresIn;
  // Support "1d", "2h", "30m", "3600s", or a plain number.
  const match = /^(\d+)([smhd])?$/.exec(raw);
  if (!match) return 60 * 60 * 24; // default 1 day
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 1);
}
