import { Student } from '../types/school';

const BASE = '/api/students';

export interface StudentsPage {
  data: Student[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getStudents(branchId?: string, page = 1, limit = 10): Promise<StudentsPage> {
  const token = localStorage.getItem('token');
  const headers: Record<string,string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (branchId) params.set('branch', branchId);
  const url = `${BASE}?${params.toString()}`;
  const res = await fetch(url, { headers });
  return res.json();
}

export async function createStudent(payload: Partial<Student>) {
  // if payload.profilePicture is a data URL, upload it first to avoid huge JSON payloads
  const pp: any = (payload as any).profilePicture;
  if (pp && typeof pp === 'string' && pp.startsWith('data:')) {
    try {
      // convert dataURL to blob
      const resBlob = await fetch(pp);
      const blob = await resBlob.blob();
      const form = new FormData();
      form.append('file', new File([blob], 'profile.png', { type: blob.type }));
      const up = await fetch('/api/uploads/profile', { method: 'POST', body: form });
      if (!up.ok) {
        const txt = await up.text();
        throw new Error(txt || `Upload failed with status ${up.status}`);
      }
      const body = await up.json();
      (payload as any).profilePicture = body.url;
    } catch (err) {
      console.error('Profile upload failed', err);
      throw err;
    }
  }

  const token = localStorage.getItem('token');
  const headers: Record<string,string> = { 'Content-Type':'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    // read error body safely using a clone so we don't consume the original stream
    try {
      const errJson = await res.clone().json();
  const message = errJson?.message || JSON.stringify(errJson);
  const err = new Error(message) as any;
  err.status = res.status;
  throw err;
    } catch (e) {
  const txt = await res.clone().text();
  const err = new Error(txt || `Request failed with status ${res.status}`) as any;
  err.status = res.status;
  throw err;
    }
  }
  return res.json();
}

export async function getStudent(id: string) {
  const token = localStorage.getItem('token');
  const headers: Record<string,string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/${id}`, { headers });
  return res.json();
}

export async function updateStudent(id: string, payload: Partial<Student>) {
  const token = localStorage.getItem('token');
  const headers: Record<string,string> = { 'Content-Type':'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
  return res.json();
}

export async function deleteStudent(id: string) {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' });
}
