import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import ToastContainer from '../components/UI/ToastContainer.tsx';
import GlobalLoading from '../components/UI/GlobalLoading.tsx';

type Toast = { 
  id: string; 
  message: string; 
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
};

type UIContextType = {
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  clearToasts: () => void;
  setGlobalLoading: (v: boolean) => void;
};

const UIContext = createContext<UIContextType | null>(null);

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000) => {
    const id = `t_${Date.now()}`;
    setToasts(prev => [{ id, message, type, duration }, ...prev]);
    // auto dismiss
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  // expose a window bridge for non-React modules to toggle loading
  (window as any).__UI_BRIDGE__ = {
    setGlobalLoading: (v: boolean) => setGlobalLoading(v),
    showToast: (m: string, t?: 'success' | 'error' | 'warning' | 'info') => showToast(m, t)
  };

  return (
    <UIContext.Provider value={{ toasts, showToast, clearToasts, setGlobalLoading: setGlobalLoading }}>
      {children}
      <ToastContainer toasts={toasts} />
      <GlobalLoading visible={globalLoading} />
    </UIContext.Provider>
  );
};

export default UIContext;
