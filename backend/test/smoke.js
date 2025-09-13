const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:5000/api';

async function login() {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email: 'superadminunhimas@gmail.com',
    password: 'ca@5G2024',
  });
  return res.data.token;
}

async function createAdminUser(token) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const res = await axios.post(`${API_BASE}/users`, {
    name: `Smoke Admin ${randomSuffix}`,
    email: `smoke-admin-${randomSuffix}@example.com`,
    password: 'Password123!',
    type: 'Admin',
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data; // The user object is nested in "data"
}

async function createBranch(token, managerId) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const res = await axios.post(`${API_BASE}/branches`, {
    name: `Smoke Branch ${randomSuffix}`,
    address: '123 Smoke Test St',
    phoneNumber: '650111222',
    email: `smoke-branch-${randomSuffix}@example.com`,
    manager: managerId,
    establishedDate: new Date().toISOString(),
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function uploadSample() {
  const filePath = path.join(__dirname, 'sample.jpg');
  if (!fs.existsSync(filePath)) {
    throw new Error('sample.jpg not found');
  }
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  const res = await axios.post(`${API_BASE}/uploads/profile`, form, {
    headers: form.getHeaders(),
  });
  return res.data.original.url;
}

async function createProgram() {
  const res = await axios.post(`${API_BASE}/programs`, {
    name: 'Smoke Program',
    type: 'Undergraduate',
    duration: 2,
  });
  return res.data;
}

async function createDepartment(programId) {
  const res = await axios.post(`${API_BASE}/departments`, {
    name: 'Smoke Dept',
    code: 'SMK',
    program: programId,
  });
  return res.data;
}

async function createStudent(programId, departmentId, branchId, profileUrl, token) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const payload = {
    firstName: `Smoke-${randomSuffix}`,
    lastName: 'Test',
    nationalIdName: `Smoke Test ${randomSuffix}`,
    gender: 'Male',
    placeOfBirth: 'Yaounde',
    dateOfBirth: '2000-01-01',
    phoneNumber: '650112233',
    email: `smoke-student-${randomSuffix}@example.com`,
    program: programId,
    department: departmentId,
    branch: branchId,
    profilePicture: profileUrl,
    guardian: { name: 'Guardian', address: 'Address', contact: '+237612345678' },
    regionOfOrigin: 'Center',
    academicYear: '2024-2025'
  };
  const res = await axios.post(`${API_BASE}/students`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

(async () => {
  try {
    console.log('Starting smoke test...');
    const token = await login();
    console.log('Logged in as SuperAdmin.');

    const adminUser = await createAdminUser(token);
    console.log('Created admin user ->', adminUser._id);

    const branch = await createBranch(token, adminUser._id);
    console.log('Created branch ->', branch._id);

    const program = await createProgram();
    console.log('Created program ->', program._id);

    const dept = await createDepartment(program._id);
    console.log('Created department ->', dept._id);

    const profileUrl = await uploadSample();
    console.log('Uploaded sample ->', profileUrl);

    const student = await createStudent(program._id, dept._id, branch._id, profileUrl, token);
    console.log('Created student ->', student.data._id);

    console.log('Smoke test finished successfully.');
  } catch (err) {
    console.error('Smoke test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
})();
