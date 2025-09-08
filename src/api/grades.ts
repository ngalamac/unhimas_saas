import fetchClient from '../lib/fetchClient';
import { handleFetchError } from '../lib/fetchClient';
import { Grade, GpaData } from '../types/grades';

const BASE = '/api/grades';

export async function getGradesForStudent(studentId: string): Promise<{ data: Grade[] }> {
    const res = await fetchClient.get(`${BASE}/student/${studentId}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function addGrade(grade: Partial<Grade>): Promise<{ data: Grade }> {
    const res = await fetchClient.postJson(BASE, grade);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function getStudentGpa(studentId: string): Promise<GpaData> {
    const res = await fetchClient.get(`/api/students/${studentId}/gpa`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    const body = await res.json();
    return body.data;
}

export async function downloadTranscript(studentId: string): Promise<Blob> {
    const res = await fetchClient.get(`/api/students/${studentId}/transcript`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.blob();
}
