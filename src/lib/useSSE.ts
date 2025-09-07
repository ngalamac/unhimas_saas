import { useEffect, useRef } from 'react';

type HandlerMap = Record<string, (data: any) => void>;

export default function useSSE(url: string, handlers: HandlerMap) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url || typeof window === 'undefined') return;
    try {
      const es = new EventSource(url);
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
      };
      return () => { try { es.close(); } catch (e) {} };
    } catch (e) {
      // not supported
    }
  }, [url]);
}
