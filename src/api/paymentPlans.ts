import { PaymentPlan } from '../types/school';
import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/payment-plans';

export async function getPaymentPlans(): Promise<{ data: PaymentPlan[] }> {
    const res = await fetchClient.get(BASE);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function createPaymentPlan(payload: Partial<PaymentPlan>): Promise<{ data: PaymentPlan }> {
    const res = await fetchClient.postJson(BASE, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function updatePaymentPlan(id: string, payload: Partial<PaymentPlan>): Promise<{ data: PaymentPlan }> {
    const res = await fetchClient.put(`${BASE}/${id}`, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function deletePaymentPlan(id: string): Promise<any> {
    const res = await fetchClient.delete(`${BASE}/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}
