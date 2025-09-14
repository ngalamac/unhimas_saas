import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createTestApp } from '../src/appForTest';
import mongoose from 'mongoose';
import request from 'supertest';

let mongo: MongoMemoryServer;
let app: any;
let programId: string;

describe('Departments API', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    app = await createTestApp(mongo.getUri());
    // create program first
    const p = await request(app).post('/api/programs').send({ name: 'Dept Program', type: 'Undergraduate', duration: 3 });
    programId = p.body._id || p.body.id;
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it('creates a department', async () => {
    const res = await request(app).post('/api/departments').send({ name: 'Test Dept', code: 'TD', program: programId });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Dept');
  });

  it('lists departments', async () => {
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('updates a department', async () => {
    const created = await request(app).post('/api/departments').send({ name: 'Upd Dept', program: programId });
    const id = created.body._id || created.body.id;
    const updated = await request(app).put(`/api/departments/${id}`).send({ name: 'Updated Department Name' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toContain('Updated');
  });

  it('deletes a department', async () => {
    const created = await request(app).post('/api/departments').send({ name: 'Del Dept', program: programId });
    const id = created.body._id || created.body.id;
    const del = await request(app).delete(`/api/departments/${id}`);
    expect([200,204]).toContain(del.status);
  });
});
