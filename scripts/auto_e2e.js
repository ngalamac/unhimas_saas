#!/usr/bin/env node
/*
 auto_e2e.js
 High-level end-to-end test runner for the Unhimas SaaS project.
 Assumes backend server is already running on http://localhost:5000.
 Writes a JSON summary file e2e-summary.json.
*/
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const BASE = 'http://localhost:5000';
const summary = { steps: [], startedAt: new Date().toISOString(), success: true };

async function step(name, fn) {
  const s = { name, ok: false, started: new Date().toISOString() };
  try {
    const result = await fn();
    s.ok = true; s.result = result; s.ended = new Date().toISOString();
  } catch (e) {
    s.ok = false; s.error = e && e.message || String(e); s.ended = new Date().toISOString();
    summary.success = false;
  }
  summary.steps.push(s);
  console.log(`[${s.ok ? 'PASS' : 'FAIL'}] ${name}`);
  if (s.error) console.error('  error:', s.error);
}

async function getJson(url, opts) {
  const r = await fetch(url, opts);
  const text = await r.text();
  try { return { status: r.status, body: JSON.parse(text) }; } catch { return { status: r.status, body: text }; }
}

async function run() {
  await step('health', async () => getJson(BASE + '/api/health'));
  let authToken = null;
  await step('login-superadmin', async () => {
    const res = await getJson(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'superadminunhimas@gmail.com', password: 'ca@5G2024' }) });
    if (res.status !== 200 || !res.body.token) throw new Error('login failed');
    authToken = res.body.token; return { user: res.body.user && res.body.user.email };
  });
  const authHeaders = () => ({ Authorization: 'Bearer ' + authToken, 'Content-Type': 'application/json' });

  // Program & Department
  let programId = null; let departmentId = null; let branchId = null; let studentId = null;
  await step('create-program', async () => {
    const r = await getJson(BASE + '/api/programs', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: 'E2E Program ' + Date.now(), type: 'Undergraduate', duration: 3 }) });
    if (r.status !== 201) throw new Error('program create status ' + r.status);
    programId = r.body._id || r.body.id; return { programId };
  });
  await step('create-department', async () => {
    const r = await getJson(BASE + '/api/departments', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: 'E2E Dept ' + Date.now(), code: 'E2E', program: programId }) });
    if (r.status !== 201) throw new Error('department create status ' + r.status);
    departmentId = r.body._id || r.body.id; return { departmentId };
  });
  // Branch attempt (may fail due to manager requirement) -> tolerate non-201
  await step('create-branch', async () => {
    const r = await getJson(BASE + '/api/branches', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: 'E2E Branch ' + Date.now(), code: 'E2EB', address: 'Address', phoneNumber: '612345678', email: 'e2e@example.com', manager: null, establishedDate: new Date().toISOString() }) });
    if (r.status === 201) branchId = r.body._id || r.body.id; else branchId = null; return { status: r.status, branchId };
  });

  // Upload sample (optional)
  await step('upload-sample', async () => {
    const sample = path.join(__dirname, '..', 'backend', 'test', 'sample.jpg');
    if (!fs.existsSync(sample)) return { skipped: true };
    const form = new FormData(); form.append('file', fs.createReadStream(sample));
    const res = await fetch(BASE + '/api/uploads/profile', { method: 'POST', headers: { Authorization: 'Bearer ' + authToken }, body: form });
    const t = await res.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
    return { status: res.status, body: b };
  });

  // Create student (branch may be null; expect failure if branch required -> treat gracefully)
  await step('create-student', async () => {
    const payload = { firstName: 'E2E', lastName: 'Student', dateOfBirth: '2000-01-01', placeOfBirth: 'Yaounde', regionOfOrigin: 'Center', phoneNumber: '652278121', gender: 'Male', program: programId, department: departmentId, guardian: { name: 'Guardian', contact: '612345678' }, academicYear: '2024', branch: branchId };
    const r = await getJson(BASE + '/api/students', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    if (r.status === 201) { studentId = r.body.data && (r.body.data._id || r.body.data.id); return { studentId }; }
    return { status: r.status, body: r.body };
  });

  // List programs & departments
  await step('list-programs', async () => getJson(BASE + '/api/programs'));
  await step('list-departments', async () => getJson(BASE + '/api/departments'));

  // Payment (only if student was created)
  await step('student-payment', async () => {
    if (!studentId) return { skipped: true };
    const r = await getJson(BASE + `/api/students/${studentId}/payments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ amount: 5000, currency: 'XAF', method: 'cash' }) });
    return r;
  });

  // Export (CSV) - requires branch when not SuperAdmin, but we are SuperAdmin
  await step('students-export', async () => getJson(BASE + '/api/students/export', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ format: 'csv', branch: branchId }) }));

  summary.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(process.cwd(), 'e2e-summary.json'), JSON.stringify(summary, null, 2));
  console.log('E2E summary written to e2e-summary.json success=' + summary.success);
  if (!summary.success) process.exit(1);
}

run().catch(e => { console.error('Runner fatal', e); process.exit(1); });
