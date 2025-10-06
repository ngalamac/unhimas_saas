import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getApp, createSuperAdmin, login, createBranch } from './testUtils';
import Specialty from '../src/models/Specialty';

async function setupProgramAndDept(token: string) {
  const prog = await request(getApp()).post('/api/programs').set('Authorization', `Bearer ${token}`).send({ name: 'Lifecycle Program', type: 'Undergraduate' });
  const programId = prog.body._id || prog.body.id;
  const dept = await request(getApp()).post('/api/departments').set('Authorization', `Bearer ${token}`).send({ name: 'Lifecycle Dept', program: programId });
  return { programId, departmentId: dept.body._id || dept.body.id };
}

describe('Student lifecycle', () => {
  it('creates, lists, searches and updates a student', async () => {
    await createSuperAdmin({ email: 'super2@test.com', password: 'Password123!' });
    const token = await login('super2@test.com', 'Password123!');
    const branch = await createBranch('Lifecycle Branch');
    const { programId, departmentId } = await setupProgramAndDept(token);
    const spec = await new Specialty({ name: 'Lifecycle Specialty', program: programId, department: departmentId }).save();
    const payload = {
      firstName: 'Alice',
      lastName: 'Wonder',
      dateOfBirth: '2005-04-01',
      placeOfBirth: 'CityX',
      regionOfOrigin: 'RegionX',
      phoneNumber: '+237612345678',
      gender: 'F',
      program: programId,
      department: departmentId,
      guardian: { name: 'Guardian Name' },
      academicYear: '2024/2025',
      branch: branch._id || branch.id,
      level: '100',
      session: 'Morning',
      specialty: spec._id.toString()
    };
  const createRes = await request(getApp()).post('/api/students').set('Authorization', `Bearer ${token}`).send(payload);
    expect(createRes.status).toBe(201);
  const studentId = (createRes.body && createRes.body.data && (createRes.body.data._id || createRes.body.data.id)) || (createRes.body._id || createRes.body.id);

  const listRes = await request(getApp()).get('/api/students').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.meta.total).toBeGreaterThan(0);

  const searchRes = await request(getApp()).get('/api/students?search=Alice').set('Authorization', `Bearer ${token}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data[0].firstName).toBe('Alice');

  const updateRes = await request(getApp()).put(`/api/students/${studentId}`).set('Authorization', `Bearer ${token}`).send({ level: '200' });
    expect([200,204]).toContain(updateRes.status); // depending on implementation
  });
});
