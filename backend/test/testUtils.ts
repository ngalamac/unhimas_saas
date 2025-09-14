import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp } from '../src/appForTest';
import User from '../src/models/User';
import BranchModel from '../src/models/BranchModel';

let mongo: MongoMemoryServer;
let app: any; // initialized in beforeAll

export function getApp() { return app; }

export async function createSuperAdmin(overrides: any = {}) {
  const user = new User({
    name: overrides.name || 'Super Admin',
    email: overrides.email || 'superadmin@example.com',
    password: overrides.password || 'Password123!',
    type: 'SuperAdmin',
    permissions: overrides.permissions || { all: { read: true, write: true } },
    ...overrides,
  } as any);
  await user.save();
  return user;
}

export async function createBasicUser(overrides: any = {}) {
  const user = new User({
    name: overrides.name || 'Basic Lecturer',
    email: overrides.email || 'lecturer@example.com',
    password: overrides.password || 'Password123!',
    type: overrides.type || 'Lecturer',
    permissions: overrides.permissions || { students: { read: true } },
    ...overrides,
  } as any);
  await user.save();
  return user;
}

export async function login(email: string, password: string) {
  const res = await request(getApp()).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

export async function createBranch(name = 'Main Campus') {
  // Ensure there is a SuperAdmin to act as creator
  const creator = await User.findOne({ type: 'SuperAdmin' }) || await new User({
    name: 'Super Admin',
    email: `super-${Date.now()}@test.com`,
    password: 'Password123!',
    type: 'SuperAdmin',
    permissions: { all: { read: true, write: true } }
  } as any).save();

  // Ensure there is an Admin manager
  const manager = await User.findOne({ type: 'Admin' }) || await new User({
    name: 'Branch Manager',
    email: `manager-${Date.now()}@test.com`,
    password: 'Password123!',
    type: 'Admin',
    permissions: { branches: { read: true, write: true } }
  } as any).save();

  const branch = new BranchModel({
    name,
    address: '123 Test Street',
    phoneNumber: '+237600000000',
    email: `${name.toLowerCase().replace(/\s+/g,'-')}@branch.test`,
    manager: manager._id,
    establishedDate: new Date(),
    createdBy: creator._id,
    studentCount: 0,
    staffCount: 0
  } as any);
  await branch.save();
  return branch as any;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  app = await createTestApp(uri);
});

afterEach(async () => {
  // clean all collections to isolate tests
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
