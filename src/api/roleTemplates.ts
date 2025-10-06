import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/role-templates';

export async function listRoleTemplates(): Promise<{ data: Array<{ role: string; permissions: any; isDefault: boolean; updatedAt?: string }> }> {
  const res = await fetchClient.get(`${BASE}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function setRoleDefaultTemplate(role: string, permissions: any): Promise<{ data: any }> {
  const res = await fetchClient.put(`${BASE}/${encodeURIComponent(role)}`, { permissions });
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}
