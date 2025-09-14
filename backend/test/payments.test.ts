import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getApp, createSuperAdmin, login } from './testUtils';

describe('Payment Plans', () => {
  it('creates, lists, fetches, updates and deletes a payment plan', async () => {
  await createSuperAdmin({ name: 'Pay Admin', email: 'pay@test.com', password: 'Password123!' });
    const token = await login('pay@test.com', 'Password123!' );
  const create = await request(getApp()).post('/api/payment-plans').set('Authorization', `Bearer ${token}`).send({ name: 'Plan A', targetAmount: 1000 });
    expect(create.status).toBe(201);
    const id = create.body.data._id || create.body.data.id;
  const list = await request(getApp()).get('/api/payment-plans').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);
  const getOne = await request(getApp()).get(`/api/payment-plans/${id}`).set('Authorization', `Bearer ${token}`);
    expect(getOne.status).toBe(200);
  const upd = await request(getApp()).put(`/api/payment-plans/${id}`).set('Authorization', `Bearer ${token}`).send({ description: 'Updated desc' });
    expect(upd.status).toBe(200);
  const del = await request(getApp()).delete(`/api/payment-plans/${id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
  });
});
