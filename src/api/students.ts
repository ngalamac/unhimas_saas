import { Student } from '../types/school';

// Use explicit backend origin during development to avoid missing dev proxy setups.
const DEV_BACKEND = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) ? 'http://localhost:5000' : '';
const BASE = `${DEV_BACKEND}/api/students`;

export interface StudentsPage {
  data: Student[];
  total: number;
  page: number;
  pageSize: number;
  aggregates?: { paid: number; partial: number; unpaid: number };
}
export async function getStudents(branchId?: string, page = 1, limit = 10, filters?: { search?: string; program?: string; status?: string }): Promise<StudentsPage> {
  const token = localStorage.getItem('token');
  const headers: Record<string,string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  else console.warn('[getStudents] no auth token found in localStorage; requests may be unauthorized');
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (branchId) params.set('branch', branchId);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.program) params.set('program', filters.program);
  if (filters?.status) params.set('status', filters.status);
  const url = `${BASE}?${params.toString()}`;
  // Debug: log request URL and headers to help diagnose empty results / auth issues
  try { console.debug('[getStudents] request', { url, headers }); } catch (e) {}
  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 401) {
      // Invalid or expired token - clear stored auth and navigate to login
      try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
      try { window.location.hash = '#/login'; } catch (e) {}
    }
    // try parse json error, fallback to text
    try {
      const err = await res.clone().json();
      const message = err?.message || JSON.stringify(err);
      const e: any = new Error(message);
      e.status = res.status;
      throw e;
    } catch (e) {
      const txt = await res.clone().text();
      const err = new Error(txt || `Request failed with status ${res.status}`) as any;
      err.status = res.status;
      throw err;
    }
  }
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
