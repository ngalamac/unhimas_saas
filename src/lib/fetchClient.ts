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
  // Highest precedence: runtime override set in index.html
  const runtimeApi = (() => { try { return (window as any).__API_BASE__ as string; } catch { return ''; } })() || '';
  const envApi = (envAny?.VITE_API_BASE_URL || envAny?.VITE_BACKEND_URL || '') as string;
  const apiUrl = (runtimeApi || envApi || '').replace(/\/$/, '');
  const base = apiUrl || (envAny?.DEV ? 'http://localhost:5000' : '');
    if (isDebug()) {
        // One-time-ish log per call site
        console.info('[fetchClient] base resolve', {
      apiUrlFromRuntime: runtimeApi || null,
      apiUrlFromEnv: envApi || null,
            dev: envAny?.DEV || false,
            mode: envAny?.MODE || null,
            chosenBase: base || '(same-origin)'
        });
    }
    return base;
};

// Exported helper so API modules (e.g., multipart uploads) can construct absolute URLs
export const apiBase = () => getBase();

// Deep connectivity diagnostics (only logs when __API_DEBUG__ is true)
export async function diagnoseConnectivity() {
  if (!isDebug()) return;
  const envAny = (import.meta as any)?.env || {};
  const runtimeApi = (() => { try { return (window as any).__API_BASE__ as string; } catch { return ''; } })() || '';
  const viteApi = (envAny?.VITE_API_BASE_URL || '') as string;
  const viteBackend = (envAny?.VITE_BACKEND_URL || '') as string;
  const base = apiBase().replace(/\/$/, '');

  const report: any = {
    windowOrigin: window.location.origin,
    runtimeApi: runtimeApi || null,
    viteApi: viteApi || null,
    viteBackend: viteBackend || null,
    mode: envAny?.MODE || null,
    dev: !!envAny?.DEV,
    chosenBase: base || '(same-origin)'
  };

  // Helper to fetch and capture result without throwing
  const tryFetch = async (url: string, init?: RequestInit) => {
    try {
      const res = await fetch(url, init);
      const ct = res.headers?.get?.('content-type') || null;
      return { ok: res.ok, status: res.status, contentType: ct };
    } catch (e: any) {
      return { ok: false, status: 0, error: (e?.message || String(e)) };
    }
  };

  report.tests = {} as any;
  // 1) Base + /api/health (intended target)
  if (base) {
    report.tests.base_get = await tryFetch(base + '/api/health');
    // HEAD no-cors to detect DNS/network without CORS noise
    report.tests.base_head_nocors = await tryFetch(base + '/api/health', { method: 'HEAD', mode: 'no-cors' as any });
  }
  // 2) Same-origin /api/health (detect static rewrite false positive)
  report.tests.same_origin_get = await tryFetch('/api/health');

  console.info('[DiagFull] connectivity', report);
}

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

export default { getAuthToken, postJson, post: postJson, get, put, delete: del, handleFetchError, apiBase, diagnoseConnectivity };
