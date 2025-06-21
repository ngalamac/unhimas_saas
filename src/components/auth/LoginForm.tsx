import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';

interface LoginFormProps {
  selectedRole: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ selectedRole }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', { username, password, role: selectedRole, rememberMe });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs sm:max-w-sm space-y-4 sm:space-y-5 lg:space-y-6">
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
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
      >
        <User className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Login</span>
      </button>
    </form>
  );
};