import { FC } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

type Toast = {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: { label: string; onClick: () => void };
};

const ToastContainer: FC<{ toasts: Toast[] }> = ({ toasts }) => {
  const getToastStyles = (type: string = 'info') => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getToastIcon = (type: string = 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`${getToastStyles(t.type)} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-80 max-w-96 animate-in slide-in-from-right-full duration-300`}
        >
          {getToastIcon(t.type)}
          <div className="flex-1 text-sm font-medium">{t.message}</div>
          {t.action && (
            <button onClick={() => { try { t.action!.onClick(); } catch (e) {} }} className="ml-2 text-sm underline">
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
