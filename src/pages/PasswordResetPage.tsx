import React, { useState } from 'react';

// CountdownMessage component
interface CountdownMessageProps {
  error: string;
}
const CountdownMessage: React.FC<CountdownMessageProps> = ({ error }) => {
  const [secondsLeft, setSecondsLeft] = React.useState(15 * 60);
  React.useEffect(() => {
    if (!error && secondsLeft > 0) {
      const timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [error, secondsLeft]);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-[#a02c2c]">Password Reset</h2>
      <p className="mb-4 text-sm text-gray-700 text-center">
        {error === 'This email is not found in our records.'
          ? error
          : error
            ? "Can't process your request due to technical reasons."
            : <>
                A password reset link has been sent to your email. Follow the instructions to set a new password.<br />
                <span className="font-semibold text-blue-700">Link expires in: {minutes}:{seconds.toString().padStart(2, '0')}</span>
              </>
        }
      </p>
    </div>
  );
};
import { useNavigate, useSearchParams } from 'react-router-dom';

// Step 1: Request email
// Step 2: Enter new password (from email link)
// Step 3: Success, redirect to login

const API_URL = '/api/auth/reset-password';
const UPDATE_URL = '/api/auth/update-password';

export const PasswordResetPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Step 1: Request password reset
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('No response from server.');
      }
      // Show error for protected accounts or unknown emails
      if (res.status === 403) {
        setError("Can't process your request due to technical reasons.");
      } else if (res.status === 404) {
        setError((data && 'error' in data ? (data as any).error : 'This email is not found in our records.'));
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate token from email link
  React.useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
      setStep(2);
    }
  }, [searchParams]);

  // Password policy
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(pwd)) return 'Password must contain a lowercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must contain a number.';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must contain a special character.';
    return '';
  };

  // Step 2: Submit new password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    const err = validatePassword(newPassword);
    if (err) {
      setPasswordError(err);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(UPDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('No response from server.');
      }
  if (!res.ok) throw new Error((data && 'error' in data ? (data as any).error : undefined) || 'Failed to reset password');
      setStep(3);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Success
  React.useEffect(() => {
    if (step === 3) {
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [step, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-gray-900 flex flex-col items-center">
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-[#a02c2c]">Password Recovery</h2>
            <p className="mb-4 text-sm text-gray-700 text-center">Enter your registered email address. If it exists, you'll receive a password reset link.</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              required
            />
            {error && <div className="mb-2 text-xs text-red-600">{error}</div>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        {step === 2 && token && (
          <form onSubmit={handlePasswordSubmit} className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-[#a02c2c]">Set New Password</h2>
            <p className="mb-2 text-sm text-gray-700 text-center">Enter your new password below. <br />
              <span className="font-semibold text-[#a02c2c]">Password must be at least 8 characters, include uppercase, lowercase, number, and special character.</span>
            </p>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              required
            />
            {passwordError && <div className="mb-2 text-xs text-red-600">{passwordError}</div>}
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Resetting...' : 'Update Password'}
            </button>
          </form>
        )}
        {step === 2 && !token && (
          <CountdownMessage error={error} />
        )}
        {step === 3 && (
          <div className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Password Reset Successful</h2>
            <p className="mb-4 text-sm text-gray-700 text-center">You will be redirected to the login page shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResetPage;
