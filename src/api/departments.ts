import { Department } from '../types/school';

const BASE = '/api/departments';

export async function getDepartments(): Promise<Department[]> {
  const res = await fetch(BASE);
  return res.json();
}

export async function createDepartment(payload: Partial<Department>) {
  const res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  return res.json();
}

export async function updateDepartment(id: string, payload: Partial<Department>) {
  const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  return res.json();
}

export async function deleteDepartment(id: string) {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' });
}
