import { Branch } from '../types/school';

export async function getBranches(): Promise<Branch[]> {
  const res = await fetch('/api/branches');
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
}

export async function createBranch(payload: Partial<Branch>): Promise<Branch> {
  const res = await fetch('/api/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create branch');
  }
  return res.json();
}

export async function updateBranch(id: string, payload: Partial<Branch>): Promise<Branch> {
  const res = await fetch(`/api/branches/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update branch');
  }
  return res.json();
}

export async function deleteBranch(id: string): Promise<{ message?: string }> {
  const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete branch');
  }
  return res.json();
}
