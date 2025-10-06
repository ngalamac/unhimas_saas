import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/specialties';

export interface Specialty {
  _id?: string;
  id?: string;
  name: string;
  program: string;
  department: string;
  isActive?: boolean;
}

export async function listSpecialties(params?: { program?: string; department?: string; search?: string }): Promise<{ data: Specialty[] }> {
  const qs = new URLSearchParams();
  if (params?.program) qs.set('program', params.program);
  if (params?.department) qs.set('department', params.department);
  if (params?.search) qs.set('search', params.search);
  const res = await fetchClient.get(`${BASE}${qs.toString() ? `?${qs.toString()}` : ''}`);
  if (!res.ok) await handleFetchError(res);
  return res.json();
}

export async function createSpecialty(payload: { name: string; program: string; department: string }): Promise<{ data: Specialty }> {
  const res = await fetchClient.postJson(BASE, payload);
  if (!res.ok) await handleFetchError(res);
  return res.json();
}

export async function updateSpecialty(id: string, payload: Partial<Specialty>): Promise<{ data: Specialty }> {
  const res = await fetchClient.put(`${BASE}/${id}`, payload);
  if (!res.ok) await handleFetchError(res);
  return res.json();
}

export async function deleteSpecialty(id: string): Promise<{ message: string }> {
  const res = await fetchClient.delete(`${BASE}/${id}`);
  if (!res.ok) await handleFetchError(res);
  return res.json();
}
