import { getJson } from '../lib/fetchClient';

export async function fetchAccountingSummary(params?: Record<string, any>) {
  let query = '';
  if (params) {
    const esc = encodeURIComponent;
    query = '?' + Object.entries(params)
      .map(([k, v]) => `${esc(k)}=${esc(v)}`)
      .join('&');
  }
  return getJson(`/api/accounting/summary${query}`);
}
