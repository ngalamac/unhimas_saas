import { Program } from '../types/school';
import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/programs';

export async function getPrograms(): Promise<{ data: Program[] }> {
    const res = await fetchClient.get(BASE);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function createProgram(payload: Partial<Program>): Promise<{ data: Program }> {
    const res = await fetchClient.postJson(BASE, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function updateProgram(id: string, payload: Partial<Program>): Promise<{ data: Program }> {
    const res = await fetchClient.put(`${BASE}/${id}`, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function deleteProgram(id: string): Promise<any> {
    const res = await fetchClient.delete(`${BASE}/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}
