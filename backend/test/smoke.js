const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE_URL = 'http://localhost:5000/api';

async function login(email, password) {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  if (res.status !== 200) throw new Error('Login failed');
  return res.data.token;
}

async function createAdminUser(token) {
  const payload = {
    name: 'Smoke Test Admin',
    email: `smoke-admin-${Date.now()}@example.com`,
    password: 'password123',
    type: 'Admin'
  };
  const res = await axios.post(`${API_BASE_URL}/users`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create admin user failed');
  return res.data;
}

async function createBranch(token, managerId) {
  const payload = {
    name: `Smoke Test Branch ${Date.now()}`,
    address: '123 Smoke Test Lane',
    phoneNumber: '555-555-5555',
    email: `smoke-branch-${Date.now()}@example.com`,
    manager: managerId,
    establishedDate: new Date().toISOString()
  };
  const res = await axios.post(`${API_BASE_URL}/branches`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create branch failed');
  return res.data;
}

async function uploadSample(token) {
  const filePath = path.join(__dirname, 'sample.jpg');
  if (!fs.existsSync(filePath)) {
    console.log('No sample.jpg found in backend/test. Create one to run smoke test.');
    return null;
  }
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const res = await axios.post(`${API_BASE_URL}/uploads/profile`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status !== 200) throw new Error('Upload failed: ' + res.statusText);
  return res.data.url;
}

async function createProgram(token) {
  const payload = {
    name: 'Smoke Test Program',
    type: 'Undergraduate',
    duration: 2
  };
  const res = await axios.post(`${API_BASE_URL}/programs`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create program failed');
  return res.data;
}

async function createDepartment(token, programId) {
  const payload = {
    name: 'Smoke Test Dept',
    code: 'SMK',
    program: programId
  };
  const res = await axios.post(`${API_BASE_URL}/departments`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create department failed');
  return res.data;
}

async function createStudent(token, branchId, programId, departmentId, profileUrl) {
  const payload = {
    firstName: 'Smoke',
    lastName: 'Test',
    dateOfBirth: '2000-01-01',
    placeOfBirth: 'Yaounde',
    regionOfOrigin: 'Center',
    phoneNumber: '6' + Math.random().toString().slice(2, 10),
    gender: 'Male',
    email: `smoke-student-${Date.now()}@example.com`,
    program: programId,
    department: departmentId,
    branch: branchId,
    guardian: { name: 'Guardian', contact: '6' + Math.random().toString().slice(2, 10) },
    academicYear: '2024-2025',
    profilePicture: profileUrl
  };
  const res = await axios.post(`${API_BASE_URL}/students`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create student failed: ' + res.data.message);
  return res.data;
}

(async () => {
  try {
    console.log('Starting smoke test...');

    console.log('Logging in as Super Admin...');
    const token = await login('superadminunhimas@gmail.com', 'ca@5G2024');
    console.log('Logged in successfully.');

    console.log('Creating Admin user...');
    const adminUser = await createAdminUser(token);
    console.log('Created admin user ->', adminUser._id);

    console.log('Creating Branch...');
    const branch = await createBranch(token, adminUser._id);
    console.log('Created branch ->', branch._id);

    console.log('Uploading sample image...');
    const profileUrl = await uploadSample(token);
    console.log('Uploaded sample ->', profileUrl);

    console.log('Creating Program...');
    const program = await createProgram(token);
    console.log('Created program ->', program._id);

    console.log('Creating Department...');
    const dept = await createDepartment(token, program._id);
    console.log('Created department ->', dept._id);

    console.log('Creating Student...');
    const student = await createStudent(token, branch._id, program._id, dept._id, profileUrl);
    console.log('Created student ->', student._id);

    console.log('Smoke test finished successfully.');
  } catch (err) {
    console.error('Smoke test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
})();
