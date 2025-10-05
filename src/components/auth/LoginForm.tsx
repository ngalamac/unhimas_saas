import React, { useState } from 'react';
import { User, Lock, Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Simple modal for login instructions
const LoginHelpModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-gray-900 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold shadow-lg border-2 border-white">&times;</button>
        <h2 className="text-xl font-bold mb-4 text-center text-[#a02c2c]">How to Login</h2>
        <div className="mb-3 text-sm text-center text-red-700 font-semibold">Important: Select your role from the options below the login form before entering your credentials.</div>
        <ul className="list-disc pl-5 space-y-2 text-sm text-left w-full">
          <li>Select your role (e.g., SuperAdmin, Admin, Accountant, etc.) before filling the form.</li>
          <li>Enter your assigned username and password in the fields provided.</li>
          <li>If you do not have login credentials, please contact the school management office.</li>
          <li>If you forget your password, use the "Forgot Password?" link or contact management.</li>
          <li>For security, do not share your password with anyone.</li>
          <li>If you encounter any issues, reach out to management for assistance.</li>
        </ul>
        <div className="mt-4 text-xs text-gray-600 text-center">This help is for users who are new to digital systems.</div>
        <button onClick={onClose} className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow">Back to Login</button>
      </div>
    </div>
  );
};

interface LoginFormProps {
  selectedRole: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ selectedRole }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password, selectedRole);
      if (success) {
        try {
          const raw = localStorage.getItem('user');
          const parsed = raw ? JSON.parse(raw) : null;
          const role = (parsed?.role as string) || '';
          // Force landing on role dashboard on fresh login
          localStorage.setItem('currentPage', 'dashboard');
          let breadcrumb: string[] = ['Dashboard'];
          switch (role) {
            case 'SuperAdmin':
              breadcrumb = ['Super Admin', 'Dashboard'];
              break;
            case 'Admin':
              breadcrumb = ['Admin', 'Dashboard'];
              break;
            case 'Lecturer':
              breadcrumb = ['Lecturer', 'Dashboard'];
              break;
            case 'Accountant':
              breadcrumb = ['Accountant', 'Dashboard'];
              break;
            case 'Dean of Studies':
              breadcrumb = ['Dean', 'Dashboard'];
              break;
            case 'Head Of Department':
              breadcrumb = ['Head Of Department', 'Dashboard'];
              break;
            default:
              breadcrumb = ['Dashboard'];
          }
          localStorage.setItem('breadcrumb', JSON.stringify(breadcrumb));
        } catch {}
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h2 className="text-lg font-semibold text-[#a02c2c] mb-6">Login</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-xs sm:max-w-sm space-y-4 sm:space-y-5 lg:space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 drop-shadow-2xl transition-colors">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}
        {/* Username field */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600 rounded-lg pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            required
            disabled={isLoading}
          />
        </div>
        {/* Password field with eye icon */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600 rounded-lg pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 bg-gray-800 dark:bg-gray-700 border-gray-600 dark:border-gray-500 rounded focus:ring-red-500"
              disabled={isLoading}
            />
            <span className="text-xs sm:text-sm text-gray-300 dark:text-gray-400">Keep me Logged in</span>
          </label>
          <button
            type="button"
            className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 underline hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
            onClick={() => window.open('/password-reset', '_blank')}
          >
            Forgot Password?
          </button>
        </div>
        {/* Login button */}
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          <span>{isLoading ? 'Logging in...' : 'Login'}</span>
        </button>
        {/* Demo credentials */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <button
            type="button"
            className="text-xs text-blue-800 dark:text-blue-300 text-center underline hover:text-blue-900 dark:hover:text-blue-200 w-full"
            onClick={() => setShowHelp(true)}
          >
            Can't login? Click here for help
          </button>
        </div>
        <LoginHelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      </form>
    </div>
  );
};