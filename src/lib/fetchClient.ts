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
    try {
        const dev = (import.meta as any)?.env?.DEV;
        if (dev) return 'http://localhost:5000';
    } catch (e) { }
    return '';
};

async function fetchWithLoading(url: string, options: RequestInit) {
    const bridge = (window as any).__UI_BRIDGE__;
    let timer: any = null;
    try {
        timer = setTimeout(() => { try { bridge?.setGlobalLoading(true); } catch (e) { } }, 300);
        const res = await fetch(url, options);
        return res;
    } catch (e) {
        try { bridge?.showToast('Network error'); } catch (er) { }
        throw e;
    } finally {
        if (timer) clearTimeout(timer);
        try { bridge?.setGlobalLoading(false); } catch (e) { }
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
    return fetchWithLoading(url, { method: 'POST', headers: defaultHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
}

export async function get(path: string, options: any = {}) {
    const base = getBase();
    const url = path.startsWith('http') ? path : `${base}${path}`;
    return fetchWithLoading(url, {
        method: 'GET',
        headers: defaultHeaders(options.headers || {}),
        ...options
    });
}

export async function put(path:string, body: any, options: any = {}) {
    const base = getBase();
    const url = path.startsWith('http') ? path : `${base}${path}`;
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
    return fetchWithLoading(url, {
        method: 'DELETE',
        headers: defaultHeaders(options.headers || {}),
        ...options
    });
}

export default { getAuthToken, postJson, post: postJson, get, put, delete: del, handleFetchError };
