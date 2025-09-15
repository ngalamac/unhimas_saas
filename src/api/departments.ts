import { Department } from '../types/school';
import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/departments';

export async function getDepartments(): Promise<{ data: Department[] }> {
    const res = await fetchClient.get(BASE);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function createDepartment(payload: Partial<Department>): Promise<{ data: Department }> {
    const res = await fetchClient.postJson(BASE, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function updateDepartment(id: string, payload: Partial<Department>): Promise<{ data: Department }> {
    const res = await fetchClient.put(`${BASE}/${id}`, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function deleteDepartment(id: string): Promise<any> {
    const res = await fetchClient.delete(`${BASE}/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    // Backend returns 204 No Content on successful delete
    if (res.status === 204) return { success: true };
    // Fallback in case backend switches to 200 with body later
    try {
        return await res.json();
    } catch {
        return { success: true };
    }
}
