import fetchClient, { handleFetchError } from '../lib/fetchClient';

export interface AdmissionApplication {
  _id?: string;
  applicantName: string;
  email: string;
  phone: string;
  program: string | { _id: string; name: string };
  branch?: string | { _id: string; name: string };
  applicationDate?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  documents?: string[];
  feesPaid?: boolean;
  notes?: string;
}

const BASE = '/api/admissions';

export async function listAdmissions(params?: { page?: number; limit?: number; status?: string; program?: string; search?: string; branch?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  if (params?.program) qs.set('program', params.program);
  if (params?.search) qs.set('search', params.search);
  if (params?.branch) qs.set('branch', params.branch);
  const res = await fetchClient.get(`${BASE}${qs.toString() ? `?${qs.toString()}` : ''}`);
  if (!res.ok) await handleFetchError(res);
  return res.json();
}

export async function createAdmission(payload: Partial<AdmissionApplication>) {
  const res = await fetchClient.postJson(BASE, payload);
  if (!res.ok) await handleFetchError(res);
  return res.json();
}

export async function updateAdmissionStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected') {
  const res = await fetchClient.postJson(`${BASE}/${encodeURIComponent(id)}/status`, { status });
  if (!res.ok) await handleFetchError(res);
  return res.json();
}

export async function getAdmissionStats(params?: { branch?: string }) {
  const qs = new URLSearchParams();
  if (params?.branch) qs.set('branch', params.branch);
  const res = await fetchClient.get(`${BASE}/stats${qs.toString() ? `?${qs.toString()}` : ''}`);
  if (!res.ok) await handleFetchError(res);
  return res.json();
}
