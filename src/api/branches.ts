import { Branch } from '../types/school';
import fetchClient from '../lib/fetchClient';

export async function getBranches(): Promise<Branch[]> {
  const res = await fetchClient.get('/api/branches');
  // backend returns paginated shape: { data: [...], meta: { ... } }
  // but some callers expect a plain Branch[] — normalize here.
  const body = await res.json().catch(() => ({}));
  if (Array.isArray(body)) return body as Branch[];
  if (Array.isArray((body as any).data)) return (body as any).data as Branch[];
  return [];
}

export async function createBranch(payload: Partial<Branch>): Promise<Branch> {
  const res = await fetchClient.postJson('/api/branches', payload);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create branch');
  }
  return res.json();
}

export async function updateBranch(id: string, payload: Partial<Branch>): Promise<Branch> {
  const res = await fetchClient.put(`/api/branches/${id}`, payload);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update branch');
  }
  return res.json();
}

export async function deleteBranch(id: string): Promise<{ message?: string }> {
  const res = await fetchClient.delete(`/api/branches/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete branch');
  }
  return res.json();
}
