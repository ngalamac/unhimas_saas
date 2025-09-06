import React from 'react';
// Use public path for logo to ensure stable serving in production
const unhimasLogo = '/unhimas-logo.png';
import { LoginForm } from './LoginForm';

interface LoginSectionProps {
  selectedRole: string;
}

export const LoginSection: React.FC<LoginSectionProps> = ({ selectedRole }) => {
  return (
  <div className="lg:flex-1 bg-white p-6 sm:p-8 lg:p-12 text-black">
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] lg:min-h-[500px]">
  {/* Logo and title */}
  <img src={unhimasLogo} alt="UNHIMAS Logo" className="mb-4 sm:mb-5 lg:mb-6 w-24 h-24 lg:w-32 lg:h-32 object-contain mx-auto" onError={e => { (e.target as HTMLImageElement).src = './src/assets/unhimas-logo.png'; }} />
  <h2 className="text-2xl lg:text-3xl font-extrabold mb-2 text-center text-black tracking-wide">UNHIMAS</h2>
  <h3 className="text-base lg:text-lg font-semibold mb-8 sm:mb-10 lg:mb-12 text-center w-full text-[#a02c2c]">Universal Higher Institute Of Management And Sciences</h3>

        {/* Login form */}
        <LoginForm selectedRole={selectedRole} />

        {/* Footer */}
  <p className="text-xs text-gray-700 mt-8 sm:mt-10 lg:mt-12 text-center px-4">
          © 2025 UNHIMAS School Management - Developed by Codegisoft
        </p>
      </div>
    </div>
  );
};