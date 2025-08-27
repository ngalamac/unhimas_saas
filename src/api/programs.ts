import { Program } from '../types/school';

const BASE = '/api/programs';

export async function getPrograms(): Promise<Program[]> {
  const res = await fetch(BASE);
  return res.json();
}

export async function createProgram(payload: Partial<Program>) {
  const res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  return res.json();
}

export async function updateProgram(id: string, payload: Partial<Program>) {
  const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  return res.json();
}

export async function deleteProgram(id: string) {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' });
}
