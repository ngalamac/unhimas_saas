import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getApp, createSuperAdmin, login, createBranch } from './testUtils';

describe('Students export', () => {
  it('exports students CSV (empty dataset) successfully', async () => {
  await createSuperAdmin({ name: 'Export Admin', email: 'export@test.com', password: 'Password123!' });
    const token = await login('export@test.com', 'Password123!');
    const branch = await createBranch('Export Branch');
  const res = await request(getApp()).get(`/api/students/export?branch=${branch._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text.split('\n')[0]).toContain('StudentId');
  });
});
