import fetchClient from '../lib/fetchClient';

export interface EnrollmentTrendPoint {
  month: string; // YYYY-MM
  label: string; // Short month label
  newAdmissions: number;
  totalEnrolled: number;
}

export async function fetchEnrollmentTrends(branch?: string): Promise<EnrollmentTrendPoint[]> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  const res = await fetchClient.get(`/api/students/stats/trends?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch enrollment trends');
  const body = await res.json();
  return body.data.months;
}

export interface AccountingTrendPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export async function fetchAccountingTrends(branch?: string): Promise<AccountingTrendPoint[]> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  const res = await fetchClient.get(`/api/transactions/summary/trends?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch accounting trends');
  const body = await res.json();
  return body.data.months;
}
