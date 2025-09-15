import fetchClient, { handleFetchError } from '../lib/fetchClient';
import { 
  TuitionStructure, 
  StudentTuitionRecord, 
  TuitionPayment,
  TuitionReminder 
} from '../types/tuition';

const BASE = '/api/tuition-management';

// Tuition Structure Management
export async function getTuitionStructures(params?: {
  program?: string;
  department?: string;
  level?: number;
  academicYear?: string;
}): Promise<{ data: TuitionStructure[] }> {
  const query = new URLSearchParams();
  if (params?.program) query.append('program', params.program);
  if (params?.department) query.append('department', params.department);
  if (params?.level) query.append('level', params.level.toString());
  if (params?.academicYear) query.append('academicYear', params.academicYear);

  const res = await fetchClient.get(`${BASE}/structures?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createTuitionStructure(payload: Partial<TuitionStructure>): Promise<{ data: TuitionStructure }> {
  const res = await fetchClient.postJson(`${BASE}/structures`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function updateTuitionStructure(id: string, payload: Partial<TuitionStructure>): Promise<{ data: TuitionStructure }> {
  const res = await fetchClient.put(`${BASE}/structures/${id}`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Student Tuition Records
export async function getStudentTuitionRecord(studentId: string): Promise<{ data: StudentTuitionRecord }> {
  const res = await fetchClient.get(`${BASE}/students/${studentId}/record`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function getStudentsTuitionRecords(params?: {
  program?: string;
  department?: string;
  level?: number;
  status?: string;
  branch?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: StudentTuitionRecord[]; meta: any }> {
  const query = new URLSearchParams();
  if (params?.program) query.append('program', params.program);
  if (params?.department) query.append('department', params.department);
  if (params?.level) query.append('level', params.level.toString());
  if (params?.status) query.append('status', params.status);
  if (params?.branch) query.append('branch', params.branch);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetchClient.get(`${BASE}/students/records?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Payment Processing
export async function recordTuitionPayment(payload: {
  studentId: string;
  installmentKey: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  paymentDate?: string;
}): Promise<{ data: { payment: TuitionPayment; journalEntry: any; updatedRecord: StudentTuitionRecord } }> {
  const res = await fetchClient.postJson(`${BASE}/payments`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function getTuitionPaymentHistory(studentId: string, params?: {
  installmentKey?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ data: TuitionPayment[] }> {
  const query = new URLSearchParams();
  if (params?.installmentKey) query.append('installmentKey', params.installmentKey);
  if (params?.fromDate) query.append('fromDate', params.fromDate);
  if (params?.toDate) query.append('toDate', params.toDate);

  const res = await fetchClient.get(`${BASE}/students/${studentId}/payments?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Reminder Management
export async function sendTuitionReminders(params?: {
  studentId?: string;
  installmentKey?: string;
  reminderType?: 'due_soon' | 'overdue' | 'final_notice';
  dryRun?: boolean;
}): Promise<{ data: { sent: number; failed: number; reminders: TuitionReminder[] } }> {
  const res = await fetchClient.postJson(`${BASE}/reminders/send`, params || {});
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function getTuitionReminders(studentId: string): Promise<{ data: TuitionReminder[] }> {
  const res = await fetchClient.get(`${BASE}/students/${studentId}/reminders`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Analytics and Reports
export async function getTuitionAnalytics(params?: {
  program?: string;
  department?: string;
  level?: number;
  academicYear?: string;
  branch?: string;
}): Promise<{ data: any }> {
  const query = new URLSearchParams();
  if (params?.program) query.append('program', params.program);
  if (params?.department) query.append('department', params.department);
  if (params?.level) query.append('level', params.level.toString());
  if (params?.academicYear) query.append('academicYear', params.academicYear);
  if (params?.branch) query.append('branch', params.branch);

  const res = await fetchClient.get(`${BASE}/analytics?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function exportTuitionReport(params: {
  format: 'excel' | 'pdf' | 'csv';
  reportType: 'payment_history' | 'outstanding_fees' | 'collection_summary';
  filters?: any;
}): Promise<Blob> {
  const query = new URLSearchParams();
  query.append('format', params.format);
  query.append('reportType', params.reportType);
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) query.append(key, String(value));
    });
  }

  const res = await fetchClient.get(`${BASE}/reports/export?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.blob();
}

// OHADA Integration
export async function syncTuitionWithOHADA(params?: {
  studentId?: string;
  fromDate?: string;
  toDate?: string;
  dryRun?: boolean;
}): Promise<{ data: { synced: number; errors: string[] } }> {
  const res = await fetchClient.postJson(`${BASE}/ohada/sync`, params || {});
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function validateOHADAAccounts(): Promise<{ data: { valid: boolean; missingAccounts: string[] } }> {
  const res = await fetchClient.get(`${BASE}/ohada/validate-accounts`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}