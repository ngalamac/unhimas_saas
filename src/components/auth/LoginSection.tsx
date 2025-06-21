import React from 'react';
import { GraduationCap } from 'lucide-react';
import { LoginForm } from './LoginForm';

interface LoginSectionProps {
  selectedRole: string;
}

export const LoginSection: React.FC<LoginSectionProps> = ({ selectedRole }) => {
  return (
    <div className="lg:flex-1 bg-gray-900 p-6 sm:p-8 lg:p-12 text-white">
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] lg:min-h-[500px]">
        {/* Logo and title */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-red-500 rounded-lg flex items-center justify-center mb-4 sm:mb-5 lg:mb-6 border-2 border-red-400">
          <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
        </div>
        
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-8 sm:mb-10 lg:mb-12 text-center">UNHIMAS</h2>

        {/* Login form */}
        <LoginForm selectedRole={selectedRole} />

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-8 sm:mt-10 lg:mt-12 text-center px-4">
          © 2025 UNHIMAS School Management - Developed by Codegisoft
        </p>
      </div>
    </div>
  );
};