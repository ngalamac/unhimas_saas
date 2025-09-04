import fetchClient from '../lib/fetchClient';

export interface TuitionPlanSummary {
  _id: string;
  program?: any;
  department?: any;
  level?: any;
  academicYear?: string;
  installments?: Array<{ key: string; label?: string; amount: number; dueDate?: string }>;
}

export async function getTuitionPlans(): Promise<TuitionPlanSummary[]> {
  const resp = await fetchClient.get('/api/tuition/plans');
  if (!resp.ok) throw new Error('Failed to load tuition plans');
  const body = await resp.json();
  return Array.isArray(body) ? body : (body.data || []);
}

export async function getTuitionPlan(id: string): Promise<TuitionPlanSummary | null> {
  const resp = await fetchClient.get(`/api/tuition/plans/${id}`);
  if (!resp.ok) return null;
  return await resp.json();
}

export async function createTuitionPlan(payload: any) {
  const resp = await fetchClient.postJson('/api/tuition/plans', payload);
  if (!resp.ok) {
    try { const err = await resp.clone().json(); throw new Error(err?.message || 'Failed to create tuition plan'); } catch (e) { throw new Error('Failed to create tuition plan'); }
  }
  return resp.json();
}

export async function updateTuitionPlan(id: string, payload: any) {
  const resp = await fetchClient.put(`/api/tuition/plans/${id}`, payload);
  if (!resp.ok) {
    try { const err = await resp.clone().json(); throw new Error(err?.message || 'Failed to update tuition plan'); } catch (e) { throw new Error('Failed to update tuition plan'); }
  }
  return resp.json();
}

export async function deleteTuitionPlan(id: string) {
  const resp = await fetchClient.delete(`/api/tuition/plans/${id}`);
  if (!resp.ok) {
    try { const err = await resp.clone().json(); throw new Error(err?.message || 'Failed to delete tuition plan'); } catch (e) { throw new Error('Failed to delete tuition plan'); }
  }
  return resp.json();
}

export default { getTuitionPlans, getTuitionPlan };
