// Central API base for all frontend requests
// Lightweight debug switch: set window.__API_DEBUG__ = true in console to enable verbose logs
const isDebug = () => {
    try { return Boolean((window as any).__API_DEBUG__); } catch { return false; }
};

export const getAuthToken = () => {
    try { return localStorage.getItem('token'); } catch (e) { return null; }
};

const defaultHeaders = (extra?: Record<string, string>) => {
    const token = getAuthToken();
    const h: Record<string, string> = { ...(extra || {}) };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
};

const getBase = () => {
    const envAny = (import.meta as any)?.env || {};
    const envApi = (envAny?.VITE_API_BASE_URL || envAny?.VITE_BACKEND_URL || '') as string;
    const apiUrl = (envApi || '').replace(/\/$/, '');
    const base = apiUrl || (envAny?.DEV ? 'http://localhost:5000' : '');
    if (isDebug()) {
        // One-time-ish log per call site
        console.info('[fetchClient] base resolve', {
            apiUrlFromEnv: envApi || null,
            dev: envAny?.DEV || false,
            mode: envAny?.MODE || null,
            chosenBase: base || '(same-origin)'
        });
    }
    return base;
};

async function fetchWithLoading(url: string, options: RequestInit) {
  const bridge = (window as any).__UI_BRIDGE__;
  let timer: any = null;
  try {
    timer = setTimeout(() => {
      try {
        bridge?.setGlobalLoading(true);
      } catch (e) {}
    }, 300);
    if (isDebug()) {
      console.debug('[fetchClient] request', {
        url,
        method: (options as any)?.method,
        headers: (options as any)?.headers,
      });
    }
    const res = await fetch(url, options);
    if (isDebug()) {
      console.debug('[fetchClient] response', { url, status: res.status, ok: res.ok });
    }
    return res;
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? (e as any).message : String(e);
    if (isDebug()) {
      console.warn('[fetchClient] network error', { url, error: msg });
    }
    try {
      bridge?.showToast('Network error');
    } catch (er) {}
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
    try {
      bridge?.setGlobalLoading(false);
    } catch (e) {}
  }
}

export async function handleFetchError(res: Response) {
    if (res.status === 401) {
        try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) { }
        try { window.location.hash = '#/login'; } catch (e) { }
    }
    try {
        const err = await res.clone().json();
        const message = err?.error?.message || err?.message || err?.error || JSON.stringify(err);
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

export async function postJson(path: string, body: any) {
    const base = getBase();
    const url = path.startsWith('http') ? path : `${base}${path}`;
    if (isDebug()) console.info('[fetchClient] POST', url);
    return fetchWithLoading(url, { method: 'POST', headers: defaultHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
}

export async function get(path: string, options: any = {}) {
    const base = getBase();
    const url = path.startsWith('http') ? path : `${base}${path}`;
    if (isDebug()) console.info('[fetchClient] GET', url);
    return fetchWithLoading(url, {
        method: 'GET',
        headers: defaultHeaders(options.headers || {}),
        ...options
    });
}

export async function put(path:string, body: any, options: any = {}) {
    const base = getBase();
    const url = path.startsWith('http') ? path : `${base}${path}`;
    if (isDebug()) console.info('[fetchClient] PUT', url);
    return fetchWithLoading(url, {
        method: 'PUT',
        headers: defaultHeaders({ 'Content-Type': 'application/json', ...options.headers }),
        body: JSON.stringify(body),
        ...options
    });
}

export async function del(path: string, options: any = {}) {
    const base = getBase();
    const url = path.startsWith('http') ? path : `${base}${path}`;
    if (isDebug()) console.info('[fetchClient] DELETE', url);
    return fetchWithLoading(url, {
        method: 'DELETE',
        headers: defaultHeaders(options.headers || {}),
        ...options
    });
}

export default { getAuthToken, postJson, post: postJson, get, put, delete: del, handleFetchError };
