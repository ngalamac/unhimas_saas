import { Course } from '../types/school';

const BASE = '/api/courses';

export async function getCourses(): Promise<Course[]> {
  const res = await fetch(BASE);
  return res.json();
}

export async function createCourse(payload: Partial<Course>) {
  const res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  return res.json();
}

export async function updateCourse(id: string, payload: Partial<Course>) {
  const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  return res.json();
}

export async function deleteCourse(id: string) {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' });
}
