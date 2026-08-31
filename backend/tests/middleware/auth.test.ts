import { createTestUser, authCookie } from '../helpers';
import { clearDatabase } from '../setup';

/**
 * Auth middleware tests — requireAuth and requireRole.
 *
 * These tests verify the security boundary of the JWT cookie auth:
 * - Missing cookie → 401
 * - Invalid/expired token → 401
 * - Valid token but wrong role → 403
 * - Valid token + correct role → passes through
 */

describe('Auth middleware (requireAuth + requireRole)', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should reject requests with no cookie (401)', async () => {
    const { createApp } = await import('../../src/app'); const app = createApp();
    const supertest = (await import('supertest')).default;
    const res = await supertest(app).get('/candidate/quizzes');
    expect(res.status).toBe(401);
  });

  it('should reject requests with an invalid token (401)', async () => {
    const { createApp } = await import('../../src/app'); const app = createApp();
    const supertest = (await import('supertest')).default;
    const res = await supertest(app)
      .get('/candidate/quizzes')
      .set('Cookie', 'qa_token=invalid-token');
    expect(res.status).toBe(401);
  });

  it('should reject a candidate accessing instructor routes (403)', async () => {
    const candidate = await createTestUser({ role: 'candidate' });
    const { createApp } = await import('../../src/app'); const app = createApp();
    const supertest = (await import('supertest')).default;
    const res = await supertest(app)
      .get('/instructor/quizzes')
      .set('Cookie', authCookie(candidate.token));
    expect(res.status).toBe(403);
  });

  it('should reject an instructor accessing admin routes (403)', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const { createApp } = await import('../../src/app'); const app = createApp();
    const supertest = (await import('supertest')).default;
    const res = await supertest(app)
      .get('/admin/users')
      .set('Cookie', authCookie(instructor.token));
    expect(res.status).toBe(403);
  });

  it('should allow a candidate to access candidate routes', async () => {
    const candidate = await createTestUser({ role: 'candidate' });
    const { createApp } = await import('../../src/app'); const app = createApp();
    const supertest = (await import('supertest')).default;
    const res = await supertest(app)
      .get('/candidate/quizzes')
      .set('Cookie', authCookie(candidate.token));
    expect(res.status).toBe(200);
  });

  it('should allow an admin to access admin routes', async () => {
    const admin = await createTestUser({ role: 'admin' });
    const { createApp } = await import('../../src/app'); const app = createApp();
    const supertest = (await import('supertest')).default;
    const res = await supertest(app)
      .get('/admin/users')
      .set('Cookie', authCookie(admin.token));
    expect(res.status).toBe(200);
  });
});
