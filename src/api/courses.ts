import { Course } from '../types/school';
import fetchClient, { handleFetchError } from '../lib/fetchClient';

const BASE = '/api/courses';

export async function getCourses(): Promise<{ data: Course[] }> {
    const res = await fetchClient.get(BASE);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function createCourse(payload: Partial<Course>): Promise<{ data: Course }> {
    const res = await fetchClient.postJson(BASE, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function updateCourse(id: string, payload: Partial<Course>): Promise<{ data: Course }> {
    const res = await fetchClient.put(`${BASE}/${id}`, payload);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}

export async function deleteCourse(id: string): Promise<any> {
    const res = await fetchClient.delete(`${BASE}/${id}`);
    if (!res.ok) {
        await handleFetchError(res);
    }
    return res.json();
}
