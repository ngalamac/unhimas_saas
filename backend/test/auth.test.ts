import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getApp, createSuperAdmin } from './testUtils';

describe('Auth /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
  await createSuperAdmin({ name: 'Admin User', email: 'admin@test.com', password: 'Secret123!' });
  const res = await request(getApp()).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Secret123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects wrong password', async () => {
  await createSuperAdmin({ name: 'Admin User', email: 'admin@test.com', password: 'Secret123!' });
  const res = await request(getApp()).post('/api/auth/login').send({ email: 'admin@test.com', password: 'BadPass1!' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('rejects unknown email', async () => {
  const res = await request(getApp()).post('/api/auth/login').send({ email: 'nope@test.com', password: 'Whatever1!' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
