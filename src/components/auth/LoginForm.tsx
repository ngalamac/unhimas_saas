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
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sign In to Your Account</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-xs sm:max-w-sm space-y-5 lg:space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl animate-shake">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <div className="relative group">
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
            disabled={isLoading}
          />
        </div>

        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-12 pr-12 py-3 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 focus:outline-none transition-colors duration-200"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors duration-200">Keep me signed in</span>
          </label>
          <button
            type="button"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
            onClick={() => window.open('/password-reset', '_blank')}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base shadow-lg hover:shadow-xl active:scale-[0.98] transform"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span>Sign In</span>
            </>
          )}
        </button>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
          <button
            type="button"
            className="text-xs text-blue-700 dark:text-blue-400 text-center hover:text-blue-900 dark:hover:text-blue-300 w-full font-medium transition-colors duration-200"
            onClick={() => setShowHelp(true)}
          >
            Need help signing in? Click here
          </button>
        </div>
        <LoginHelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      </form>
    </div>
  );
};