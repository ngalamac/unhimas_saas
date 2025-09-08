import { Branch } from '../types/school';
import fetchClient, { handleFetchError } from '../lib/fetchClient';

export async function getBranches(): Promise<{ data: Branch[] }> {
    const res = await fetchClient.get('/api/branches');
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function createBranch(payload: Partial<Branch>): Promise<{ data: Branch }> {
    const res = await fetchClient.postJson('/api/branches', payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function updateBranch(id: string, payload: Partial<Branch>): Promise<{ data: Branch }> {
    const res = await fetchClient.put(`/api/branches/${id}`, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function deleteBranch(id: string): Promise<{ data: { message?: string } }> {
    const res = await fetchClient.delete(`/api/branches/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}
