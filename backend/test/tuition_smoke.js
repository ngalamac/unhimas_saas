const axios = require('axios');
const assert = require('assert');

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
    name: `Tuition Smoke Admin ${randomSuffix}`,
    email: `tuition-smoke-admin-${randomSuffix}@example.com`,
    password: 'Password123!',
    type: 'Admin',
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
}

async function createBranch(token, managerId) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const res = await axios.post(`${API_BASE}/branches`, {
    name: `Tuition Smoke Branch ${randomSuffix}`,
    address: '456 Tuition Test Ave',
    phoneNumber: '650333444',
    email: `tuition-smoke-branch-${randomSuffix}@example.com`,
    manager: managerId,
    establishedDate: new Date().toISOString(),
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function createProgram() {
  const res = await axios.post(`${API_BASE}/programs`, {
    name: 'Tuition Smoke Program',
    type: 'Undergraduate',
    duration: 3,
  });
  return res.data;
}

async function createDepartment(programId) {
  const res = await axios.post(`${API_BASE}/departments`, {
    name: 'Tuition Smoke Dept',
    code: 'TSD',
    program: programId,
  });
  return res.data;
}

async function createTuitionPlan(token, programId, departmentId) {
    const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const res = await axios.post(`${API_BASE}/tuition/plans`, {
        name: `Smoke Test Plan ${academicYear}`,
        academicYear: academicYear,
        level: '1',
        program: programId,
        department: departmentId,
        installments: [
            { key: 'registration', label: 'Registration', amount: 100000 },
            { key: 'first', label: 'First Installment', amount: 250000 },
            { key: 'second', label: 'Second Installment', amount: 150000 },
        ],
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
}

async function createStudent(programId, departmentId, branchId, tuitionPlanId, token) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const payload = {
    firstName: `TuitionSmoke-${randomSuffix}`,
    lastName: 'Test',
    nationalIdName: `Tuition Smoke Test ${randomSuffix}`,
    gender: 'Female',
    placeOfBirth: 'Douala',
    dateOfBirth: '2001-05-10',
    phoneNumber: '650555666',
    email: `tuition-smoke-student-${randomSuffix}@example.com`,
    program: programId,
    department: departmentId,
    branch: branchId,
    tuitionPlan: tuitionPlanId,
    guardian: { name: 'Guardian', address: 'Address', contact: '+237612345678' },
    regionOfOrigin: 'Littoral',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  };
  const res = await axios.post(`${API_BASE}/students`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data; // student object is in "data" property
}

async function getStudent(id, token) {
  const res = await axios.get(`${API_BASE}/students/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data; // student object is in "data" property
}

(async () => {
  try {
    console.log('Tuition smoke test starting...');
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

    const tuitionPlan = await createTuitionPlan(token, program._id, dept._id);
    console.log('Created tuition plan ->', tuitionPlan._id);

    const student = await createStudent(program._id, dept._id, branch._id, tuitionPlan._id, token);
    console.log('Created student ->', student._id);

    const fetchedStudent = await getStudent(student._id, token);
    console.log('Fetched student has tuitionInstallments:', Array.isArray(fetchedStudent.tuitionInstallments));

    assert(Array.isArray(fetchedStudent.tuitionInstallments), 'tuitionInstallments should be an array');
    assert(fetchedStudent.tuitionInstallments.length > 0, 'tuitionInstallments should not be empty');

    const balance = fetchedStudent.balanceDue;
    console.log('Balance due on student:', balance);
    assert(balance > 0, 'Balance due should be greater than 0');

    console.log('Tuition smoke test finished successfully.');
  } catch (err) {
    console.error('Tuition smoke test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
})();
