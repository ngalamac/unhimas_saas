const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

async function callJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    try { return { status: res.status, body: JSON.parse(text) }; } catch { return { status: res.status, body: text }; }
  } catch (e) { return { error: e.message || String(e) }; }
}

async function run() {
  try {
    console.log('=== Automated smoke start ===');
    const backend = 'http://localhost:5000';

    // 1) health
    const health = await callJson(backend + '/api/health');
    console.log('health:', health);

    // 2) login as seeded SuperAdmin
    const login = await callJson(backend + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'superadminunhimas@gmail.com', password: 'ca@5G2024' }) });
    console.log('login:', login);
    const token = login && login.body && login.body.token ? login.body.token : null;
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // 3) upload sample image
    const samplePath = path.join(__dirname, '..', 'backend', 'test', 'sample.jpg');
    if (!fs.existsSync(samplePath)) {
      console.log('Sample missing at', samplePath);
    } else {
      const form = new FormData();
      form.append('file', fs.createReadStream(samplePath));
      const upRes = await fetch(backend + '/api/uploads/profile', { method: 'POST', headers: authHeader, body: form });
      const upText = await upRes.text();
      let upBody;
      try { upBody = JSON.parse(upText); } catch { upBody = upText; }
      console.log('upload status', upRes.status, 'body:', upBody);
    }

    // 4) create program
    const prog = await callJson(backend + '/api/programs', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ name: 'AutoSmoke Program', type: 'Undergraduate', duration: 3 }) });
    console.log('program create:', prog);
    const progId = prog && prog.body && (prog.body._id || prog.body.id) || null;

    // 5) create department
    const dept = await callJson(backend + '/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ name: 'AutoSmoke Dept', code: 'ASD', program: progId }) });
    console.log('department create:', dept);
    const deptId = dept && dept.body && (dept.body._id || dept.body.id) || null;

    // 6) create branch (SuperAdmin only)
    const branch = await callJson(backend + '/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ name: 'AutoSmoke Branch', code: 'ASB', address: 'Nowhere', phoneNumber: '612345678', email: 'asb@example.com', manager: null, establishedDate: new Date().toISOString() }) });
    console.log('branch create:', branch);
    const branchId = branch && branch.body && (branch.body._id || branch.body.id) || null;

    // 7) create a user (Admin) to be branch manager
    const newUser = await callJson(backend + '/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ name: 'Auto Admin', email: `autoadmin+${Date.now()}@example.com`, password: 'Admin@1234', type: 'Admin', branch: branchId, phoneNumber: '612345678' }) });
    console.log('user create:', newUser);
    const managerId = newUser && newUser.body && newUser.body.data && (newUser.body.data._id || newUser.body.data.id) || null;

    // If branch manager id can be set now, try to update branch manager
    if (managerId && branchId) {
      await callJson(backend + `/api/branches/${branchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ manager: managerId }) });
    }

    // 8) create student (authenticated route)
    const studentPayload = {
      firstName: 'Auto', lastName: 'Smoke', dateOfBirth: '2000-01-01', placeOfBirth: 'Nowhere', regionOfOrigin: 'Center',
      phoneNumber: '652278121', gender: 'Male', program: progId, department: deptId, guardian: { name: 'Guardian', contact: '612345678' },
      academicYear: '2024', branch: branchId
    };
    const student = await callJson(backend + '/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(studentPayload) });
    console.log('student create:', student);
    const studentId = student && student.body && student.body.data && (student.body.data._id || student.body.data.id) || null;

    // 9) record a tuition payment for the created student (if student created)
    if (studentId) {
      const payment = await callJson(backend + `/api/students/${studentId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ amount: 10000, currency: 'XAF', method: 'cash', notes: 'Automated test' }) });
      console.log('payment record:', payment);
    }

    // 10) export students as CSV (POST export requires auth)
    const exportRes = await callJson(backend + '/api/students/export', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ format: 'csv', branch: branchId }) });
    console.log('export response:', exportRes && exportRes.status);

    console.log('=== Automated smoke finished ===');
  } catch (err) {
    console.error('Automated smoke failed:', err && err.message);
    process.exit(1);
  }
}

run();
