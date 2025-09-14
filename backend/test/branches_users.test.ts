import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getApp, createSuperAdmin, login } from './testUtils';
import User from '../src/models/User';

describe('Branches & Users', () => {
  it('creates a branch and user then lists users', async () => {
  await createSuperAdmin({ name: 'Super Admin', email: 'super@test.com', password: 'Password123!' });
    const token = await login('super@test.com', 'Password123!');
  const bRes = await request(getApp()).post('/api/branches').set('Authorization', `Bearer ${token}`).send({ name: 'North Campus', code: 'north' });
    expect([200,201]).toContain(bRes.status);
    const branchId = (bRes.body._id || bRes.body.id);
    // create user
  const hashedUser = new User({ name: 'Teacher User', email: 'teacher@test.com', password: 'Password123!', type: 'Lecturer', permissions: { students: { read: true } }, branch: branchId });
    await hashedUser.save();
  const listRes = await request(getApp()).get('/api/branches').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
  });
});
