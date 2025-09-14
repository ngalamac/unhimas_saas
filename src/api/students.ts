import { Student } from '../types/school';
import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/students';

export interface StudentsPage {
    data: Student[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        aggregates?: { paid: number; partial: number; pending: number; overdue: number };
    }
}

export async function getStudents(branchId?: string, page = 1, limit = 10, filters?: { search?: string; program?: string; status?: string }): Promise<StudentsPage> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (branchId) params.set('branch', branchId);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.program) params.set('program', filters.program);
    if (filters?.status) params.set('tuitionStatus', filters.status);

    const res = await fetchClient.get(`${BASE}?${params.toString()}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function createStudent(payload: Partial<Student>): Promise<{ data: Student }> {
    const pp: any = payload.profilePicture;
    if (pp && typeof pp === 'string' && pp.startsWith('data:')) {
        try {
            const resBlob = await fetch(pp);
            const blob = await resBlob.blob();
            const form = new FormData();
            form.append('file', new File([blob], 'profile.png', { type: blob.type }));

            const token = fetchClient.getAuthToken ? fetchClient.getAuthToken() : null;
            const up = await fetch('/api/uploads/profile', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
            if (!up.ok) {
                const txt = await up.text();
                throw new Error(txt || `Upload failed with status ${up.status}`);
            }
            const body = await up.json();
            payload.profilePicture = body.data.filePath;
        } catch (err) {
            console.error('Profile upload failed', err);
            throw err;
        }
    }

    const res = await fetchClient.postJson(BASE, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function getStudent(id: string): Promise<{ data: Student }> {
    const res = await fetchClient.get(`${BASE}/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function payTuition(id: string, payload: { amount: number; currency?: string; installmentKey?: string; method?: string; notes?: string; creditAccountCode?: string }): Promise<{ data: any }> {
    const res = await fetchClient.postJson(`${BASE}/${id}/payments`, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function updateStudent(id: string, payload: Partial<Student>): Promise<{ data: Student }> {
    const res = await fetchClient.put(`${BASE}/${id}`, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function restoreStudent(id: string): Promise<{ data: Student }> {
    const res = await fetchClient.postJson(`${BASE}/${id}/restore`, {});
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function setEnrollmentStatus(id: string, status: string): Promise<{ data: Student }> {
    const res = await fetchClient.postJson(`${BASE}/${id}/enrollment`, { enrollmentStatus: status });
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function deleteStudent(id: string): Promise<any> {
    const res = await fetchClient.delete(`${BASE}/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export interface StudentLedgerLine {
    date: string;
    reference: string;
    description: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    runningBalance: number;
}

export interface StudentLedgerResponse {
    data: {
        studentId: string;
        period?: string;
        lines: StudentLedgerLine[];
        totalDebit: number;
        totalCredit: number;
        balance: number;
    }
}

export async function getStudentLedger(id: string, opts?: { period?: string }): Promise<StudentLedgerResponse> {
    const params = new URLSearchParams();
    if (opts?.period) params.set('period', opts.period);
    const res = await fetchClient.get(`${BASE}/${id}/ledger${params.toString() ? `?${params.toString()}` : ''}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export interface StudentFinanceSummary {
  tuitionStatus: string;
  totalInstallmentDue: number;
  totalInstallmentPaid: number;
  totalInstallmentRemaining: number;
    paymentsTotal: number;
  studentRecordedTotalPaid: number;
  studentRecordedBalance: number;
  accountingLedgerDebit: number;
  accountingLedgerCredit: number;
  accountingLedgerBalance: number;
  paymentsCount: number;
  ledgerLinesCount: number;
}

export interface StudentFinanceResponse {
  data: {
    student: any;
    payments: any[];
    installments: Array<{ key?: string; label?: string; amountDue: number; paid: number; remaining: number; status: string; dueDate?: string|null }>;
    ledger: { lines: any[]; totals: { debit: number; credit: number; balance: number } };
    summary: StudentFinanceSummary;
  }
}

export async function getStudentFinance(id: string, opts?: { period?: string; paymentsLimit?: number }): Promise<StudentFinanceResponse> {
  const params = new URLSearchParams();
  if (opts?.period) params.set('period', opts.period);
  if (opts?.paymentsLimit) params.set('paymentsLimit', String(opts.paymentsLimit));
  const res = await fetchClient.get(`${BASE}/${id}/finance${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}