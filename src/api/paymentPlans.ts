import fetchClient from '../lib/fetchClient';

export async function getPaymentPlans() {
  const res = await fetchClient.get('/api/payment-plans');
  if (!res.ok) throw new Error('Failed to load payment plans');
  const body = await res.json();
  return Array.isArray(body) ? body : (body.data || []);
}

export async function createPaymentPlan(payload: any) {
  const res = await fetchClient.postJson('/api/payment-plans', payload);
  if (!res.ok) {
    try { const err = await res.clone().json(); throw new Error(err?.message || 'Failed to create payment plan'); } catch (e) { throw new Error('Failed to create payment plan'); }
  }
  return res.json();
}

export async function updatePaymentPlan(id: string, payload: any) {
  const res = await fetchClient.put(`/api/payment-plans/${id}`, payload);
  if (!res.ok) {
    try { const err = await res.clone().json(); throw new Error(err?.message || 'Failed to update payment plan'); } catch (e) { throw new Error('Failed to update payment plan'); }
  }
  return res.json();
}

export async function deletePaymentPlan(id: string) {
  const res = await fetchClient.delete(`/api/payment-plans/${id}`);
  if (!res.ok) {
    try { const err = await res.clone().json(); throw new Error(err?.message || 'Failed to delete payment plan'); } catch (e) { throw new Error('Failed to delete payment plan'); }
  }
  return res.json();
}
