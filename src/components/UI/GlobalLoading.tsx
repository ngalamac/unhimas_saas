import { FC } from 'react';

const GlobalLoading: FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white px-6 py-4 rounded shadow flex items-center space-x-3">
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
        <span>Loading...</span>
      </div>
    </div>
  );
};

export default GlobalLoading;
