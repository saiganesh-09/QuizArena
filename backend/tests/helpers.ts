import { signToken } from '../src/utils/jwt';
import { User } from '../src/models/User';
import type { UserRole } from '../src/types/auth';

/**
 * Test helpers for creating test users and auth tokens.
 */

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}

/** Create a test user in the DB and return the user + a signed JWT. */
export async function createTestUser(opts: {
  name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}): Promise<TestUser> {
  const role = opts.role ?? 'candidate';
  const email = opts.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  const name = opts.name ?? 'Test User';
  const password = opts.password ?? 'Password123!';

  const user = await User.create({ name, email, password, role, status: 'active' });
  const token = signToken({ sub: user._id.toString(), email, role });

  return {
    id: user._id.toString(),
    email,
    name,
    role,
    token,
  };
}

/** Create a cookie header string for a test user's token. */
export function authCookie(token: string): string {
  return `qa_token=${token}`;
}
