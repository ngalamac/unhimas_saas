import fetchClient from '../lib/fetchClient';

export async function fetchAccountingSummary(params?: Record<string, any>) {
    let query = '';
    if (params) {
        const esc = encodeURIComponent;
        query = '?' + Object.entries(params)
            .map(([k, v]) => `${esc(k)}=${esc(v)}`)
            .join('&');
    }
    const res = await fetchClient.get(`/api/transactions/summary${query}`);
    if (!res.ok) {
        throw new Error('Failed to fetch accounting summary');
    }
    const body = await res.json();
    return body.data;
}
