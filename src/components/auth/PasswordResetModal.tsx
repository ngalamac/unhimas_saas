import React, { useState } from 'react';

interface PasswordResetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error: string;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ open, onClose, onSubmit, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Strong password policy: min 8 chars, uppercase, lowercase, number, special char
  const passwordPolicy = {
    minLength: 8,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[^A-Za-z0-9]/,
  };

  const validatePassword = (pwd: string) => {
    if (pwd.length < passwordPolicy.minLength) return 'Password must be at least 8 characters.';
    if (!passwordPolicy.uppercase.test(pwd)) return 'Password must contain an uppercase letter.';
    if (!passwordPolicy.lowercase.test(pwd)) return 'Password must contain a lowercase letter.';
    if (!passwordPolicy.number.test(pwd)) return 'Password must contain a number.';
    if (!passwordPolicy.special.test(pwd)) return 'Password must contain a special character.';
    return '';
  };
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-gray-900 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold shadow-lg border-2 border-white">&times;</button>
        <h2 className="text-xl font-bold mb-4 text-center text-[#a02c2c]">Reset Your Password</h2>
        {!showPasswordInput ? (
          <>
            <p className="mb-4 text-sm text-gray-700 text-center">Enter your email address or username. We'll send you a password reset link.</p>
            <input
              type="email"
              placeholder="Email or Username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
            {error && <div className="mb-2 text-xs text-red-600">{error}</div>}
            <button
              onClick={() => {
                onSubmit(email);
                // Simulate link sent, show password input
                setTimeout(() => setShowPasswordInput(true), 1200);
              }}
              disabled={isLoading || !email}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm text-gray-700 text-center">Enter your new password below. <br />
              <span className="font-semibold text-[#a02c2c]">Password must be at least 8 characters, include uppercase, lowercase, number, and special character.</span>
            </p>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => {
                setNewPassword(e.target.value);
                setPasswordError(validatePassword(e.target.value));
              }}
              className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
            {passwordError && <div className="mb-2 text-xs text-red-600">{passwordError}</div>}
            <button
              onClick={() => {
                const err = validatePassword(newPassword);
                setPasswordError(err);
                if (!err) {
                  // TODO: Call backend to update password
                  alert('Password updated successfully!');
                  onClose();
                }
              }}
              disabled={!!passwordError || !newPassword}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-2"
            >
              Update Password
            </button>
          </>
        )}
      </div>
    </div>
  ) : null;
};
