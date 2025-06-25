import React, { useState } from 'react';
import { User, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  selectedRole: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ selectedRole }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        navigate('/dashboard');
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
    <form onSubmit={handleSubmit} className="w-full max-w-xs sm:max-w-sm space-y-4 sm:space-y-5 lg:space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
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
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
          required
          disabled={isLoading}
        />
      </div>

      {/* Password field */}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
          required
          disabled={isLoading}
        />
      </div>

      {/* Remember me and forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 bg-gray-800 border-gray-600 rounded focus:ring-red-500"
            disabled={isLoading}
          />
          <span className="text-xs sm:text-sm text-gray-300">Remember</span>
        </label>
        <a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
          Lose Your Password?
        </a>
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
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800 text-center">
          <strong>Demo:</strong> Use any username/password to login
        </p>
      </div>
    </form>
  );
};