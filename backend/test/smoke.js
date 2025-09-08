const fs = require('fs');
const path = require('path');
// Node 18+ has global fetch; fall back to dynamic import for older setups
let fetchFn;
async function initFetch() {
  if (typeof fetch === 'function') {
    fetchFn = fetch;
  } else {
    const nf = await import('node-fetch');
    fetchFn = nf.default;
  }
  return fetchFn;
}

async function uploadSample() {
  const filePath = path.join(__dirname, 'sample.jpg');
  if (!fs.existsSync(filePath)) {
    console.log('No sample.jpg found in backend/test. Create one to run smoke test.');
    return null;
  }
  const form = new (require('form-data'))();
  form.append('file', fs.createReadStream(filePath));
  const res = await (fetchFn || fetch)('http://localhost:5000/api/uploads/profile', { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
  const body = await res.json();
  return body.url;
}

async function createProgram() {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Program', type: 'Diploma', duration: 2 })
  });
  if (!res.ok) throw new Error('Create program failed: ' + res.statusText);
  return res.json();
}

async function createDepartment() {
  const res = await (fetchFn || fetch)('http://localhost:5000/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Dept', code: 'SMK' })
  });
  if (!res.ok) throw new Error('Create department failed: ' + res.statusText);
  return res.json();
}

async function createStudent(programId, departmentId, profileUrl) {
  const payload = {
    firstName: 'Smoke',
    lastName: 'Test',
    nationalIdName: 'Smoke Test',
    gender: 'Male',
    placeOfBirth: 'Yaounde',
    dateOfBirth: '2000-01-01',
    phoneNumber: '+2376' + '12345678'.slice(1),
    email: 'smoke@example.com',
    program: programId,
    department: departmentId,
    profilePicture: profileUrl,
    guardian: { name: 'Guardian', address: 'Address', contact: '+237612345678' }
  };
  const res = await (fetchFn || fetch)('http://localhost:5000/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Create student failed: ' + res.status + ' ' + text);
  return JSON.parse(text);
}

(async () => {
  try {
  console.log('Starting smoke test...');
  await initFetch();
  const profileUrl = await uploadSample();
    console.log('Uploaded sample ->', profileUrl);
    const program = await createProgram();
    console.log('Created program ->', program._id || program.id);
    const dept = await createDepartment();
    console.log('Created department ->', dept._id || dept.id);
    const student = await createStudent(program._id || program.id, dept._id || dept.id, profileUrl);
    console.log('Created student ->', student._id || student.id);
    console.log('Smoke test finished successfully.');
  } catch (err) {
    console.error('Smoke test failed:', err.message || err);
    process.exit(1);
  }
})();
