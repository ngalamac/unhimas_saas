const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
let fetchFn;
async function initFetch() {
  if (typeof fetch === 'function') fetchFn = fetch;
  else {
    const nf = await import('node-fetch');
    fetchFn = nf.default;
  }
  return fetchFn;
}

async function login() {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadminunhimas@gmail.com', password: 'ca@5G2024' })
  });
  if (!res.ok) throw new Error('Login failed');
  const { token } = await res.json();
  return token;
}

async function createAdminUser(token) {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Branch Manager Smoke',
      email: `manager-smoke-${Date.now()}@example.com`,
      password: 'Password123!',
      type: 'Admin'
    })
  });
  if (!res.ok) throw new Error('Create admin user failed: ' + res.statusText);
  return res.json();
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://unhimas4:n673927826@cluster0.xeab0d2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function insertTuitionPlan() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  const coll = mongoose.connection.collection('tuitionplans');
  const doc = {
    program: null,
    department: null,
    level: '1',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
    installments: [
      { key: 'registration', label: 'Registration', amount: 100000 },
      { key: 'first', label: 'First Installment', amount: 50000 }
    ],
    active: true,
    notes: 'Smoke test plan',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const r = await coll.insertOne(doc);
  await mongoose.disconnect();
  return r.insertedId.toString();
}

async function createProgram(token) {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/programs', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Smoke Program', type: 'Undergraduate', duration: 2 })
  });
  if (!res.ok) throw new Error('Create program failed: ' + res.statusText);
  return res.json();
}

async function createDepartment(programId, token) {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/departments', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Smoke Dept', code: 'SMK', program: programId })
  });
  if (!res.ok) throw new Error('Create department failed: ' + res.statusText);
  return res.json();
}

async function createBranch(managerId, token) {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Tuition Smoke Test Branch',
      location: 'Tuition Smoke Test Location',
      address: '123 Smoke St',
      phoneNumber: '6' + Math.random().toString().slice(2, 10),
      email: `branch-smoke-${Date.now()}@example.com`,
      manager: managerId,
      establishedDate: new Date().toISOString()
    })
  });
  if (!res.ok) throw new Error('Create branch failed: ' + res.statusText);
  return res.json();
}

async function createStudent(programId, departmentId, branchId, tuitionPlanId, token) {
  const payload = {
    firstName: 'TuitionSmoke',
    lastName: 'Test',
    gender: 'Male',
    placeOfBirth: 'Yaounde',
    regionOfOrigin: 'Center',
    dateOfBirth: '2000-01-01',
    phoneNumber: '6' + Math.random().toString().slice(2, 10),
    email: `tuition-smoke-${Date.now()}@example.com`,
    program: programId,
    department: departmentId,
    profilePicture: null,
    guardian: { name: 'Guardian', address: 'Address', contact: '6' + Math.random().toString().slice(2, 10) },
    branch: branchId,
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
    tuitionPlan: tuitionPlanId
  };
  const res = await (fetchFn || fetch)('http://localhost:5000/api/students', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Create student failed: ' + res.status + ' ' + text);
  return JSON.parse(text);
}

async function getStudent(id, token) {
  const res = await (fetchFn || fetch)(`http://localhost:5000/api/students/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const txt = await res.text();
  if (!res.ok) throw new Error('Fetch student failed: ' + res.status + ' ' + txt);
  return JSON.parse(txt);
}

async function cleanupOldData() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  console.log('Cleaning up old smoke test data...');
  const plansColl = mongoose.connection.collection('tuitionplans');
  await plansColl.deleteMany({ notes: 'Smoke test plan' });
  const studentsColl = mongoose.connection.collection('students');
  await studentsColl.deleteMany({ firstName: 'TuitionSmoke' });
  await mongoose.disconnect();
  console.log('Cleanup complete.');
}

(async () => {
  try {
    console.log('Tuition smoke test starting...');
    await initFetch();
    const token = await login();
    console.log('Logged in successfully.');
    await cleanupOldData();
    const planId = await insertTuitionPlan();
    console.log('Inserted tuition plan id ->', planId);
    const adminUser = await createAdminUser(token);
    console.log('Created admin user ->', adminUser._id);
    const program = await createProgram(token);
    const dept = await createDepartment(program._id, token);
    const branch = await createBranch(adminUser._id, token);
    console.log('Created program/department/branch ->', program._id, dept._id, branch._id);
    const student = await createStudent(program._id, dept._id, branch._id, planId, token);
    console.log('Created student ->', student._id);
    const fetched = await getStudent(student._id, token);
    console.log('Fetched student has tuitionInstallments:', Array.isArray(fetched.tuitionInstallments));
    if (!Array.isArray(fetched.tuitionInstallments) || fetched.tuitionInstallments.length === 0) {
      throw new Error('tuitionInstallments missing or empty on created student');
    }
    const balance = fetched.balanceDue || fetched.balance || null;
    console.log('Balance due on student:', balance);
    console.log('Tuition smoke test finished successfully.');
  } catch (err) {
    console.error('Tuition smoke test failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
