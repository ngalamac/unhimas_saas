import React from 'react';
// Use public path for logo to ensure stable serving in production
const unhimasLogo = '/unhimas-logo.png';
import { LoginForm } from './LoginForm';

interface LoginSectionProps {
  selectedRole: string;
}

export const LoginSection: React.FC<LoginSectionProps> = ({ selectedRole }) => {
  return (
    <div className="lg:flex-1 p-6 sm:p-8 lg:p-12 text-black dark:text-white transition-all duration-300">
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] lg:min-h-[500px]">
        <div className="relative mb-6 transform hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
          <img
            src={unhimasLogo}
            alt="UNHIMAS Logo"
            className="relative w-24 h-24 lg:w-32 lg:h-32 object-contain mx-auto drop-shadow-2xl"
            onError={e => { (e.target as HTMLImageElement).src = '/unhimas-logo.png'; }}
          />
        </div>

        <h2 className="text-3xl lg:text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400 tracking-wide">
          UNHIMAS
        </h2>

        <h3 className="text-sm lg:text-base font-medium mb-8 sm:mb-10 lg:mb-12 text-center w-full text-gray-600 dark:text-gray-400 max-w-md">
          Universal Higher Institute Of Management And Sciences
        </h3>

        <LoginForm selectedRole={selectedRole} />

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-8 sm:mt-10 lg:mt-12 text-center px-4">
          © 2025 UNHIMAS School Management · Developed by Codegisoft
        </p>
      </div>
    </div>
  );
};