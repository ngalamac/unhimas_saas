import { Program } from '../types/school';
import fetchClient from '../lib/fetchClient';

const BASE = '/api/programs';

export async function getPrograms(): Promise<Program[]> {
  const res = await fetchClient.get(BASE);
  return res.json();
}

export async function createProgram(payload: Partial<Program>) {
  const res = await fetchClient.postJson(BASE, payload);
  return res.json();
}

export async function updateProgram(id: string, payload: Partial<Program>) {
  const res = await fetchClient.put(`${BASE}/${id}`, payload);
  return res.json();
}

export async function deleteProgram(id: string) {
  await fetchClient.delete(`${BASE}/${id}`);
}
