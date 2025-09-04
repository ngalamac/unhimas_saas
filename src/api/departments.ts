import { Department } from '../types/school';
import fetchClient from '../lib/fetchClient';

const BASE = '/api/departments';

export async function getDepartments(): Promise<Department[]> {
  const res = await fetchClient.get(BASE);
  return res.json();
}

export async function createDepartment(payload: Partial<Department>) {
  const res = await fetchClient.postJson(BASE, payload);
  return res.json();
}

export async function updateDepartment(id: string, payload: Partial<Department>) {
  const res = await fetchClient.put(`${BASE}/${id}`, payload);
  return res.json();
}

export async function deleteDepartment(id: string) {
  await fetchClient.delete(`${BASE}/${id}`);
}
