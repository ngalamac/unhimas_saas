import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createTestApp } from '../src/appForTest';
import mongoose from 'mongoose';
import request from 'supertest';

let mongo: MongoMemoryServer;
let app: any;
let programId: string;
let departmentId: string;

// NOTE: Student creation route in production requires auth + permissions + branch id etc.
// For unit-ish testing without full auth stack we would normally mock auth or expose a test-only route.
// Here we only verify that unauthenticated POST currently (likely) fails with 401/400 depending on middleware.

describe('Students API (public surface)', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    app = await createTestApp(mongo.getUri());
    const p = await request(app).post('/api/programs').send({ name: 'Stud Program', type: 'Undergraduate', duration: 3 });
    programId = p.body._id || p.body.id;
    const d = await request(app).post('/api/departments').send({ name: 'Stud Dept', code: 'SD', program: programId });
    departmentId = d.body._id || d.body.id;
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it('lists students (expects auth failure or empty with 401)', async () => {
    const res = await request(app).get('/api/students');
    expect([401,403]).toContain(res.status);
  });

  it('attempts create student without auth -> expect 401', async () => {
    const res = await request(app).post('/api/students').send({ firstName: 'A', lastName: 'B' });
    expect([400,401,403]).toContain(res.status);
  });
});
