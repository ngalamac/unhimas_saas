import { FC } from 'react';

const ToastContainer: FC<{ toasts: Array<{ id: string; message: string }> }> = ({ toasts }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {toasts.map(t => (
        <div key={t.id} className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow flex items-center space-x-4">
          <div className="flex-1 text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
