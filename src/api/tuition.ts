import { TuitionPlan } from '../types/school';
import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/tuition/plans';

export async function getTuitionPlans(): Promise<{ data: TuitionPlan[] }> {
    const res = await fetchClient.get(BASE);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function getTuitionPlan(id: string): Promise<{ data: TuitionPlan }> {
    const res = await fetchClient.get(`${BASE}/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function createTuitionPlan(payload: Partial<TuitionPlan>): Promise<{ data: TuitionPlan }> {
    const res = await fetchClient.postJson(BASE, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function updateTuitionPlan(id: string, payload: Partial<TuitionPlan>): Promise<{ data: TuitionPlan }> {
    const res = await fetchClient.put(`${BASE}/${id}`, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function deleteTuitionPlan(id: string): Promise<any> {
    const res = await fetchClient.delete(`${BASE}/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export default { getTuitionPlans, getTuitionPlan, createTuitionPlan, updateTuitionPlan, deleteTuitionPlan };
