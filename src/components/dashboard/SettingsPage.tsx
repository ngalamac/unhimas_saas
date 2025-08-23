import React from 'react';
import { useAuth } from '../../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const adminEmail = user?.email || 'superadminunhimas@gmail.com';
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState('');

  const handleAdminPasswordReset = async () => {
    setResetLoading(true);
    setResetMsg('');
    try {
      const res = await fetch('/api/auth/panel-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json();
      setResetMsg(data.message || 'If authorized, you will receive a password reset email.');
    } catch {
      setResetMsg('Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
      <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
        <div>
          <span className="font-medium text-gray-700">Your Email:</span>
          <span className="ml-2 text-gray-900">{adminEmail}</span>
        </div>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold shadow"
          onClick={handleAdminPasswordReset}
          disabled={resetLoading}
        >
          {resetLoading ? 'Sending...' : 'Reset Password'}
        </button>
        {resetMsg && <span className="text-green-700 font-medium ml-4">{resetMsg}</span>}
      </div>
    </div>
  );
};

export default SettingsPage;
