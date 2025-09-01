export const getAuthToken = () => {
  try { return localStorage.getItem('token'); } catch (e) { return null; }
};

const defaultHeaders = (extra?: Record<string,string>) => {
  const token = getAuthToken();
  const h: Record<string,string> = { ...(extra || {}) };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export async function postJson(path: string, body: any) {
  const res = await fetch(path, { method: 'POST', headers: defaultHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
  return res;
}

export function openWithAuth(url: string) {
  // use a temporary form to include Authorization as a query param? backend expects header.
  // For downloads we open a new window with the user's current session; Authorization header will be present in XHR but not window.open.
  // We'll just open the URL — backend should accept cookie/session or token in header; recommend backend allow token in query when necessary.
  window.open(url, '_blank');
}

export default { getAuthToken, postJson, openWithAuth };
