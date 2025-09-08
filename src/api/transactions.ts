import fetchClient from '../lib/fetchClient';
import { JournalEntry } from '../types/accounting';

const BASE = '/api/transactions';

export async function getJournalEntries(params: { page?: number, limit?: number, branch?: string } = {}) {
    const urlParams = new URLSearchParams();
    if (params.page) urlParams.set('page', String(params.page));
    if (params.limit) urlParams.set('limit', String(params.limit));
    if (params.branch) urlParams.set('branch', params.branch);

    const res = await fetchClient.get(`${BASE}?${urlParams.toString()}`);
    if (!res.ok) {
        throw new Error('Failed to fetch journal entries');
    }
    const body = await res.json();
    return body.data as { data: JournalEntry[], meta: any };
}

export async function createJournalEntry(entry: Partial<JournalEntry>) {
    const res = await fetchClient.postJson(BASE, entry);
    if (!res.ok) {
        throw new Error('Failed to create journal entry');
    }
    const body = await res.json();
    return body.data as JournalEntry;
}

export async function updateJournalEntry(id: string, entry: Partial<JournalEntry>) {
    const res = await fetchClient.put(`${BASE}/${id}`, entry);
    if (!res.ok) {
        throw new Error('Failed to update journal entry');
    }
    const body = await res.json();
    return body.data as JournalEntry;
}

export async function deleteJournalEntry(id: string) {
    const res = await fetchClient.delete(`${BASE}/${id}`);
    if (!res.ok) {
        throw new Error('Failed to delete journal entry');
    }
    return res.json();
}

export async function approveJournalEntry(id: string) {
    const res = await fetchClient.postJson(`${BASE}/${id}/approve`, {});
    if (!res.ok) {
        throw new Error('Failed to approve journal entry');
    }
    const body = await res.json();
    return body.data as JournalEntry;
}

export async function rejectJournalEntry(id: string, reason: string) {
    const res = await fetchClient.postJson(`${BASE}/${id}/reject`, { reason });
    if (!res.ok) {
        throw new Error('Failed to reject journal entry');
    }
    const body = await res.json();
    return body.data as JournalEntry;
}
