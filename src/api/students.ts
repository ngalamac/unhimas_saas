import { Student } from '../types/school';
import fetchClient from '../lib/fetchClient';

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
  // fetchClient will attach Authorization header when token exists
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (branchId) params.set('branch', branchId);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.program) params.set('program', filters.program);
  if (filters?.status) params.set('status', filters.status);
  const url = `${BASE}?${params.toString()}`;
  // Debug: log request URL to help diagnose empty results / auth issues
  try { console.debug('[getStudents] request', { url }); } catch (e) {}
  const res = await fetchClient.get(url);
  if (!res.ok) {
    if (res.status === 401) {
      try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
      try { window.location.hash = '#/login'; } catch (e) {}
    }
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
  // Attach Authorization header for upload
  const token = fetchClient.getAuthToken ? fetchClient.getAuthToken() : null;
  const up = await fetch('/api/uploads/profile', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!up.ok) {
        const txt = await up.text();
        throw new Error(txt || `Upload failed with status ${up.status}`);
      }
      const body = await up.json();
      // backend now returns relative url like /api/uploads/file/:id — resolve to absolute
      const returned = body.url as string;
      if (returned && !/^https?:\/\//i.test(returned)) {
        (payload as any).profilePicture = `${DEV_BACKEND || window.location.origin}${returned}`;
      } else {
        (payload as any).profilePicture = returned;
      }
    } catch (err) {
      console.error('Profile upload failed', err);
      throw err;
    }
  }

  const res = await fetchClient.postJson(BASE, payload);
  if (!res.ok) {
    if (res.status === 401) {
      try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
      try { window.location.hash = '#/login'; } catch (e) {}
    }
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
  const res = await fetchClient.get(`${BASE}/${id}`);
  return res.json();
}

export async function getTuition(id: string) {
  const res = await fetchClient.get(`${BASE}/${id}/tuition`);
  if (!res.ok) throw new Error('Failed to fetch tuition');
  return res.json();
}

export async function payTuition(id: string, payload: { amount: number; currency?: string; installmentKey?: string; method?: string; notes?: string }) {
  const res = await fetchClient.postJson(`${BASE}/${id}/payments`, payload);
  if (!res.ok) {
    try {
      const err = await res.clone().json();
      const message = err?.message || `Payment failed (${res.status})`;
      const e: any = new Error(message);
      e.status = res.status;
      throw e;
    } catch (e) {
      const txt = await res.clone().text();
      const err = new Error(txt || `Payment failed with status ${res.status}`) as any;
      err.status = res.status;
      throw err;
    }
  }
  return res.json();
}

export async function updateStudent(id: string, payload: Partial<Student>) {
  const res = await fetchClient.put(`${BASE}/${id}`, payload);
  return res.json();
}

export async function restoreStudent(id: string) {
  const res = await fetchClient.postJson(`${BASE}/${id}/restore`, {});
  if (!res.ok) {
    try {
      const err = await res.clone().json();
      const message = err?.message || JSON.stringify(err) || `Restore failed (${res.status})`;
      const e: any = new Error(message);
      e.status = res.status;
      throw e;
    } catch (e) {
      const txt = await res.clone().text();
      const err = new Error(txt || `Restore failed with status ${res.status}`) as any;
      err.status = res.status;
      throw err;
    }
  }
  return res.json();
}

export async function setEnrollmentStatus(id: string, status: string) {
  const res = await fetchClient.postJson(`${BASE}/${id}/enrollment`, { enrollmentStatus: status });
  return res.json();
}

export async function deleteStudent(id: string) {
  const res = await fetchClient.delete(`${BASE}/${id}`);
  if (!res.ok) {
    try {
      const err = await res.json().catch(() => ({}));
      const message = err?.message || `Failed to delete student (status ${res.status})`;
      const e: any = new Error(message);
      e.status = res.status;
      throw e;
    } catch (e) {
      throw e;
    }
  }
}
