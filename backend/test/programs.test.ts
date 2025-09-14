import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createTestApp } from '../src/appForTest';
import mongoose from 'mongoose';
import request from 'supertest';

let mongo: MongoMemoryServer;
let app: any;

describe('Programs API', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    app = await createTestApp(mongo.getUri());
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it('creates a program', async () => {
    const res = await request(app).post('/api/programs').send({ name: 'Test Program', type: 'Undergraduate', duration: 3 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Program');
  });

  it('lists programs', async () => {
    const res = await request(app).get('/api/programs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('updates a program', async () => {
    const created = await request(app).post('/api/programs').send({ name: 'ToUpdate', type: 'Undergraduate', duration: 3 });
    const id = created.body._id || created.body.id;
    const updated = await request(app).put(`/api/programs/${id}`).send({ duration: 5 });
    expect(updated.status).toBe(200);
    expect(updated.body.duration).toBe(5);
  });

  it('deletes a program', async () => {
    const created = await request(app).post('/api/programs').send({ name: 'ToDelete', type: 'Undergraduate', duration: 3 });
    const id = created.body._id || created.body.id;
    const del = await request(app).delete(`/api/programs/${id}`);
    expect([200,204]).toContain(del.status);
  });
});
