import { Course } from '../types/school';
import fetchClient from '../lib/fetchClient';

const BASE = '/api/courses';

export async function getCourses(): Promise<Course[]> {
  const res = await fetchClient.get(BASE);
  return res.json();
}

export async function createCourse(payload: Partial<Course>) {
  const res = await fetchClient.postJson(BASE, payload);
  return res.json();
}

export async function updateCourse(id: string, payload: Partial<Course>) {
  const res = await fetchClient.put(`${BASE}/${id}`, payload);
  return res.json();
}

export async function deleteCourse(id: string) {
  await fetchClient.delete(`${BASE}/${id}`);
}
