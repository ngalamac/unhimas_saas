import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getApp, createSuperAdmin, createBasicUser, createBranch, login } from './testUtils';
import Specialty from '../src/models/Specialty';
import request from 'supertest';
import User from '../src/models/User';

// This test ensures refined RBAC denies access when action-specific permission is missing.

describe('RBAC negative scenarios', () => {
  it('denies creating a student when user only has students:read', async () => {
    await createSuperAdmin(); // ensure system bootstrap
    const branch = await createBranch('RBAC Branch');
    const readOnlyUser = await createBasicUser({
      email: 'readonly@test.com',
      permissions: { students: { read: true } },
      branch: branch._id
    });

    const token = await login(readOnlyUser.email, 'Password123!');

    const res = await request(getApp())
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'M',
        level: '100',
        branch: branch._id.toString()
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it('allows creating a student when students:create is granted', async () => {
    await createSuperAdmin();
    const branch = await createBranch('RBAC Branch 2');
    const writer = await createBasicUser({
      email: 'writer@test.com',
      // Route currently requires both students:create and students:write
      permissions: { students: { create: true, write: true }, all: { read: true } },
      branch: branch._id
    });

    const token = await login(writer.email, 'Password123!');

    // Create program/department and specialty
    const prog = await request(getApp()).post('/api/programs').set('Authorization', `Bearer ${token}`).send({ name: 'RBAC Program', type: 'Undergraduate' });
    const programId = prog.body._id || prog.body.id;
    const dept = await request(getApp()).post('/api/departments').set('Authorization', `Bearer ${token}`).send({ name: 'RBAC Dept', program: programId });
    const departmentId = dept.body._id || dept.body.id;
    const spec = await new Specialty({ name: 'RBAC Specialty', program: programId as any, department: departmentId as any } as any).save();

    const res = await request(getApp())
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'F',
        dateOfBirth: '2000-01-01',
        placeOfBirth: 'Yaounde',
        regionOfOrigin: 'Centre',
        phoneNumber: '+237600000001',
      program: programId,
      department: departmentId,
        guardian: { name: 'Guardian Name' },
        academicYear: '2024/2025',
        level: '100',
      branch: branch._id.toString(),
      specialty: spec._id.toString()
      });

    expect([200,201]).toContain(res.status);
  });
});
