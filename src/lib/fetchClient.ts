// Helper for GET requests that returns parsed JSON
export async function getJson(path: string, options: any = {}) {
  const res = await get(path, options);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    // Unauthorized; clear session and redirect to login
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use a full page reload to ensure all state is cleared
      window.location.href = '/login';
    } catch (e) {
      console.error('Failed to clear session on logout', e);
    }
    // Return a new promise that will never resolve, to prevent further processing
    return new Promise(() => {});
  }
  return res;
}

export const getAuthToken = () => {
  try { return localStorage.getItem('token'); } catch (e) { return null; }
};

const defaultHeaders = (extra?: Record<string,string>) => {
  const token = getAuthToken();
  const h: Record<string,string> = { ...(extra || {}) };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const getBase = () => {
  // in dev, target the backend running on port 5000 to avoid proxy config issues
  try {
    // Vite exposes import.meta.env.DEV
    const dev = (import.meta as any)?.env?.DEV;
    if (dev) return 'http://localhost:5000';
  } catch (e) {}
  return '';
};

export async function postJson(path: string, body: any) {
  const base = getBase();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const bridge = (window as any).__UI_BRIDGE__;
  let timer: any = null;
  try {
    // If request takes longer than 300ms, show a global loader
    timer = setTimeout(() => { try { bridge && bridge.setGlobalLoading && bridge.setGlobalLoading(true); } catch (e) {} }, 300);
    const res = await fetch(url, { method: 'POST', headers: defaultHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
    return handleResponse(res);
  } catch (e) {
    try { bridge && bridge.showToast && bridge.showToast('Network error'); } catch (er) {}
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
    try { bridge && bridge.setGlobalLoading && bridge.setGlobalLoading(false); } catch (e) {}
  }
}

export async function get(path: string, options: any = {}) {
  const base = getBase();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const bridge = (window as any).__UI_BRIDGE__;
  let timer: any = null;
  try {
    // If request takes longer than 300ms, show a global loader
    timer = setTimeout(() => { try { bridge && bridge.setGlobalLoading && bridge.setGlobalLoading(true); } catch (e) {} }, 300);
    const res = await fetch(url, { 
      method: 'GET', 
      headers: defaultHeaders(options.headers || {}),
      ...options
    });
    
  // Return response even when not ok so callers can inspect body and status
  return handleResponse(res);
  } catch (e) {
    try { bridge && bridge.showToast && bridge.showToast('Network error'); } catch (er) {}
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
    try { bridge && bridge.setGlobalLoading && bridge.setGlobalLoading(false); } catch (e) {}
  }
}

export async function put(path: string, body: any, options: any = {}) {
  const base = getBase();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const bridge = (window as any).__UI_BRIDGE__;
  let timer: any = null;
  try {
    // If request takes longer than 300ms, show a global loader
    timer = setTimeout(() => { try { bridge && bridge.setGlobalLoading && bridge.setGlobalLoading(true); } catch (e) {} }, 300);
    const res = await fetch(url, { 
      method: 'PUT', 
      headers: defaultHeaders({ 'Content-Type': 'application/json', ...options.headers }),
      body: JSON.stringify(body),
      ...options
    });
    
  // Return response even when not ok so callers can inspect body and status
  return handleResponse(res);
  } catch (e) {
    try { bridge && bridge.showToast && bridge.showToast('Network error'); } catch (er) {}
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
    try { bridge && bridge.setGlobalLoading && bridge.setGlobalLoading(false); } catch (e) {}
  }
}

export async function del(path: string, options: any = {}) {
  const base = getBase();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const bridge = (window as any).__UI_BRIDGE__;
  let timer: any = null;
  try {
    // If request takes longer than 300ms, show a global loader
    timer = setTimeout(() => { try { bridge && bridge.setGlobalLoading && bridge.setGlobalLoading(true); } catch (e) {} }, 300);
    const res = await fetch(url, { 
      method: 'DELETE', 
      headers: defaultHeaders(options.headers || {}),
      ...options
    });
    
  // Return response even when not ok so callers can inspect body and status
  return handleResponse(res);
  } catch (e) {
    try { bridge && bridge.showToast && bridge.showToast('Network error'); } catch (er) {}
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
    try { bridge && bridge.setGlobalLoading && bridge.setGlobalLoading(false); } catch (e) {}
  }
}

export function openWithAuth(url: string) {
  // use a temporary form to include Authorization as a query param? backend expects header.
  // For downloads we open a new window with the user's current session; Authorization header will be present in XHR but not window.open.
  // We'll just open the URL — backend should accept cookie/session or token in header; recommend backend allow token in query when necessary.
  window.open(url, '_blank');
}

export default { getAuthToken, postJson, post: postJson, get, put, delete: del, openWithAuth };
