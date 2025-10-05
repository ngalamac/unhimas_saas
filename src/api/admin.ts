import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/admin';

export type ResetMode = 'soft' | 'hard';

export async function resetDatabase(payload: {
  mode: ResetMode;
  includeGridfs?: boolean;
  preserveEmails?: string[];
  apply?: boolean;
  confirmToken?: string;
}): Promise<{ data: any }> {
  const res = await fetchClient.postJson(`${BASE}/reset-database`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}
