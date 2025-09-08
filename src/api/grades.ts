import fetchClient from '../lib/fetchClient';
import { Grade, GpaData } from '../types/grades';

const BASE = '/api/grades';

export async function getGradesForStudent(studentId: string) {
    const res = await fetchClient.get(`${BASE}/student/${studentId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch grades');
    }
    const body = await res.json();
    return body.data as Grade[];
}

export async function addGrade(grade: Partial<Grade>) {
    const res = await fetchClient.postJson(BASE, grade);
    if (!res.ok) {
        throw new Error('Failed to add grade');
    }
    const body = await res.json();
    return body.data as Grade;
}

export async function getStudentGpa(studentId: string): Promise<GpaData> {
    const res = await fetchClient.get(`/api/students/${studentId}/gpa`);
    if (!res.ok) {
        throw new Error('Failed to fetch GPA');
    }
    const body = await res.json();
    return body.data as GpaData;
}

export async function downloadTranscript(studentId: string): Promise<Blob> {
    const res = await fetchClient.get(`/api/students/${studentId}/transcript`);
    if (!res.ok) {
        throw new Error('Failed to download transcript');
    }
    return res.blob();
}
