import { useEffect, useRef } from 'react';
const isDebug = () => {
  try { return Boolean((window as any).__API_DEBUG__); } catch { return false; }
};
const getBase = () => {
  try {
    const env: any = (import.meta as any)?.env || {};
    const api = (env?.VITE_API_BASE_URL || env?.VITE_BACKEND_URL || '').toString().replace(/\/$/, '');
    return api || (env?.DEV ? 'http://localhost:5000' : '');
  } catch { return ''; }
};

type HandlerMap = Record<string, (data: any) => void>;

export default function useSSE(url: string, handlers: HandlerMap) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url || typeof window === 'undefined') return;
    try {
      const base = getBase();
      const full = /^https?:\/\//i.test(url) ? url : `${base}${url}`;
      if (isDebug()) console.info('[SSE] connecting', full || url);
      const es = new EventSource(full);
      esRef.current = es;
      es.onmessage = (ev) => {
        // default message event type
        try {
          const d = JSON.parse(ev.data);
          handlers['message'] && handlers['message'](d);
        } catch (e) {}
      };
      // attach custom handlers
      Object.keys(handlers).forEach(k => {
        if (k === 'message') return;
        es.addEventListener(k, (ev: any) => {
          try { const d = JSON.parse(ev.data); handlers[k] && handlers[k](d); } catch (e) {}
        });
      });
      es.onerror = () => {
        // try to reconnect is handled by browser; we ignore errors here
        if (isDebug()) console.warn('[SSE] error (browser will retry)');
      };
      return () => { try { es.close(); } catch (e) {} };
    } catch (e) {
      // not supported
    }
  }, [url]);
}
