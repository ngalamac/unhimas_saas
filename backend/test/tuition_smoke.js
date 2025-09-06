const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function login(email, password) {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  if (res.status !== 200) throw new Error('Login failed');
  return res.data.token;
}

async function createAdminUser(token) {
  const payload = {
    name: 'Tuition Smoke Admin',
    email: `tuition-smoke-admin-${Date.now()}@example.com`,
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
    name: `Tuition Smoke Branch ${Date.now()}`,
    address: '456 Smoke Test Ave',
    phoneNumber: '555-555-5556',
    email: `tuition-smoke-branch-${Date.now()}@example.com`,
    manager: managerId,
    establishedDate: new Date().toISOString()
  };
  const res = await axios.post(`${API_BASE_URL}/branches`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create branch failed');
  return res.data;
}

async function createProgram(token) {
  const payload = {
    name: 'Tuition Smoke Program',
    type: 'Undergraduate'
  };
  const res = await axios.post(`${API_BASE_URL}/programs`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create program failed');
  return res.data;
}

async function createDepartment(token, programId) {
  const payload = {
    name: 'Tuition Smoke Dept',
    program: programId
  };
  const res = await axios.post(`${API_BASE_URL}/departments`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create department failed');
  return res.data;
}

async function createTuitionPlan(token) {
  const payload = {
    name: `Tuition Smoke Plan ${Date.now()}`,
    academicYear: '2024-2025',
    level: '100',
    installments: [
      { key: 'registration', label: 'Registration', amount: 100000 },
      { key: 'first', label: 'First Installment', amount: 50000 }
    ]
  };
  const res = await axios.post(`${API_BASE_URL}/tuition/plans`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create tuition plan failed');
  return res.data;
}

async function createStudent(token, branchId, programId, departmentId, tuitionPlanId) {
  const payload = {
    firstName: 'TuitionSmoke',
    lastName: 'Test',
    dateOfBirth: '2001-01-01',
    placeOfBirth: 'Douala',
    regionOfOrigin: 'Littoral',
    phoneNumber: '6' + Math.random().toString().slice(2, 10),
    gender: 'Female',
    email: `tuition-smoke-student-${Date.now()}@example.com`,
    program: programId,
    department: departmentId,
    branch: branchId,
    guardian: { name: 'Guardian', contact: '6' + Math.random().toString().slice(2, 10) },
    academicYear: '2024-2025',
    tuitionPlan: tuitionPlanId
  };
  const res = await axios.post(`${API_BASE_URL}/students`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 201) throw new Error('Create student failed: ' + res.data.message);
  return res.data;
}

async function getStudent(token, id) {
  const res = await axios.get(`${API_BASE_URL}/students/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status !== 200) throw new Error('Fetch student failed');
  return res.data;
}

(async () => {
  let token;
  try {
    console.log('Tuition smoke test starting...');

    console.log('Logging in as Super Admin...');
    token = await login('superadminunhimas@gmail.com', 'ca@5G2024');
    console.log('Logged in successfully.');

    console.log('Creating Admin user...');
    const adminUser = await createAdminUser(token);
    console.log('Created admin user ->', adminUser._id);

    console.log('Creating Branch...');
    const branch = await createBranch(token, adminUser._id);
    console.log('Created branch ->', branch._id);

    console.log('Creating Program...');
    const program = await createProgram(token);
    console.log('Created program ->', program._id);

    console.log('Creating Department...');
    const dept = await createDepartment(token, program._id);
    console.log('Created department ->', dept._id);

    console.log('Creating Tuition Plan...');
    const plan = await createTuitionPlan(token);
    console.log('Created tuition plan ->', plan._id);

    console.log('Creating Student...');
    const student = await createStudent(token, branch._id, program._id, dept._id, plan._id);
    console.log('Created student ->', student._id);

    console.log('Fetching student to verify tuition installments...');
    const fetched = await getStudent(token, student._id);
    console.log('Fetched student has tuitionInstallments:', Array.isArray(fetched.tuitionInstallments));
    if (!Array.isArray(fetched.tuitionInstallments) || fetched.tuitionInstallments.length === 0) {
      throw new Error('tuitionInstallments missing or empty on created student');
    }
    const balance = fetched.balanceDue;
    console.log('Balance due on student:', balance);
    if (balance !== 150000) {
        throw new Error(`Expected balance to be 150000, but was ${balance}`);
    }
    console.log('Tuition smoke test finished successfully.');

  } catch (err) {
    console.error('Tuition smoke test failed:', err.response ? err.response.data : err.message);
    if (err.response && err.response.config && err.response.config.data) {
      console.error('Request payload:', err.response.config.data);
    }
    process.exit(1);
  }
})();
