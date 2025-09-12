import fetchClient, { handleFetchError } from '../lib/fetchClient';
import { StaffMember, TeachingSession, PayrollPeriod, PayrollEntry, PayrollSummary } from '../types/payroll';

const BASE = '/api/payroll';

// Staff Management
export async function getStaff(): Promise<{ data: StaffMember[] }> {
  const res = await fetchClient.get('/api/staff');
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createStaffMember(payload: Partial<StaffMember>): Promise<{ data: StaffMember }> {
  const res = await fetchClient.postJson('/api/staff', payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function updateStaffMember(id: string, payload: Partial<StaffMember>): Promise<{ data: StaffMember }> {
  const res = await fetchClient.put(`/api/staff/${id}`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Teaching Sessions
export async function getTeachingSessions(params?: { lecturer?: string; course?: string; month?: number; year?: number }): Promise<{ data: TeachingSession[] }> {
  const query = new URLSearchParams();
  if (params?.lecturer) query.append('lecturer', params.lecturer);
  if (params?.course) query.append('course', params.course);
  if (params?.month) query.append('month', params.month.toString());
  if (params?.year) query.append('year', params.year.toString());

  const res = await fetchClient.get(`${BASE}/sessions?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createTeachingSession(payload: Partial<TeachingSession>): Promise<{ data: TeachingSession }> {
  const res = await fetchClient.postJson(`${BASE}/sessions`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function approveTeachingSession(id: string): Promise<{ data: TeachingSession }> {
  const res = await fetchClient.postJson(`${BASE}/sessions/${id}/approve`, {});
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Payroll Periods
export async function getPayrollPeriods(): Promise<{ data: PayrollPeriod[] }> {
  const res = await fetchClient.get(`${BASE}/periods`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createPayrollPeriod(payload: { month: number; year: number; branch?: string }): Promise<{ data: PayrollPeriod }> {
  const res = await fetchClient.postJson(`${BASE}/periods`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function processPayroll(periodId: string): Promise<{ data: PayrollEntry[] }> {
  const res = await fetchClient.postJson(`${BASE}/periods/${periodId}/process`, {});
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Payroll Entries
export async function getPayrollEntries(periodId: string): Promise<{ data: PayrollEntry[] }> {
  const res = await fetchClient.get(`${BASE}/entries?period=${periodId}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function updatePayrollEntry(id: string, payload: Partial<PayrollEntry>): Promise<{ data: PayrollEntry }> {
  const res = await fetchClient.put(`${BASE}/entries/${id}`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function approvePayrollEntry(id: string): Promise<{ data: PayrollEntry }> {
  const res = await fetchClient.postJson(`${BASE}/entries/${id}/approve`, {});
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function markPayrollEntryPaid(id: string, paymentData: { paymentDate: string; paymentMethod: string; notes?: string }): Promise<{ data: PayrollEntry }> {
  const res = await fetchClient.postJson(`${BASE}/entries/${id}/pay`, paymentData);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Reports and Analytics
export async function getPayrollSummary(periodId: string): Promise<{ data: PayrollSummary }> {
  const res = await fetchClient.get(`${BASE}/summary/${periodId}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function exportPayroll(periodId: string, format: 'csv' | 'xlsx' | 'pdf'): Promise<Blob> {
  const res = await fetchClient.get(`${BASE}/export/${periodId}?format=${format}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.blob();
}