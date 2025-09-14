import fetchClient from '../lib/fetchClient';

const BASE = '/api/tuition-plans';

export async function applyTuitionPlan(planId: string, body: { dryRun?: boolean; limit?: number } = {}) {
  const res = await fetchClient.post(`${BASE}/${planId}/apply`, body);
  if (!res.ok) throw new Error('Failed to apply plan');
  return res.json();
}

export async function listInstallmentStudents(planId: string, key: string, status?: 'paid'|'partial'|'unpaid') {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const res = await fetchClient.get(`${BASE}/${planId}/installments/${key}/students${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) throw new Error('Failed to list installment students');
  return res.json();
}

export async function runTuitionRemindersScan() {
  const res = await fetchClient.get(`${BASE}/reminders/run`);
  if (!res.ok) throw new Error('Failed to run reminder scan');
  return res.json();
}

export async function markInstallmentReminder(studentId: string, installmentKey: string) {
  const res = await fetchClient.post(`${BASE}/reminders/mark`, { studentId, installmentKey });
  if (!res.ok) throw new Error('Failed to mark reminder');
  return res.json();
}
