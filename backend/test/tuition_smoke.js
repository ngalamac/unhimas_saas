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

async function createProgram() {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/programs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Program', type: 'Undergraduate', duration: 2 })
  });
  if (!res.ok) throw new Error('Create program failed: ' + res.statusText);
  return res.json();
}

async function createDepartment() {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/departments', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Dept', code: 'SMK' })
  });
  if (!res.ok) throw new Error('Create department failed: ' + res.statusText);
  return res.json();
}

async function createStudent(programId, departmentId, tuitionPlanId) {
  const payload = {
    firstName: 'TuitionSmoke',
    lastName: 'Test',
    nationalIdName: 'Tuition Smoke Test',
    gender: 'Male',
    placeOfBirth: 'Yaounde',
    dateOfBirth: '2000-01-01',
    phoneNumber: '+237612345678',
    email: 'tuition-smoke@example.com',
    program: programId,
    department: departmentId,
    profilePicture: null,
    guardian: { name: 'Guardian', address: 'Address', contact: '+237612345678' },
    branch: null,
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
    tuitionPlan: tuitionPlanId
  };
  const res = await (fetchFn || fetch)('http://localhost:5000/api/students', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Create student failed: ' + res.status + ' ' + text);
  return JSON.parse(text);
}

async function getStudent(id) {
  const res = await (fetchFn || fetch)(`http://localhost:5000/api/students/${id}`);
  const txt = await res.text();
  if (!res.ok) throw new Error('Fetch student failed: ' + res.status + ' ' + txt);
  return JSON.parse(txt);
}

(async () => {
  try {
    console.log('Tuition smoke test starting...');
    await initFetch();
    const planId = await insertTuitionPlan();
    console.log('Inserted tuition plan id ->', planId);
    const program = await createProgram();
    const dept = await createDepartment();
    console.log('Created program/department ->', program._id || program.id, dept._id || dept.id);
    const student = await createStudent(program._id || program.id, dept._id || dept.id, planId);
    console.log('Created student ->', student._id || student.id);
    const fetched = await getStudent(student._id || student.id);
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
