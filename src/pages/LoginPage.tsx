import React, { useState } from 'react';
import { BackgroundPattern } from '../components/layout/BackgroundPattern';
import { WelcomeSection } from '../components/auth/WelcomeSection';
import { LoginSection } from '../components/auth/LoginSection';
import { RoleSelector } from '../components/auth/RoleSelector';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('SuperAdmin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900 flex flex-col lg:items-center lg:justify-center p-2 sm:p-4 lg:p-8 transition-colors relative overflow-hidden">
      <BackgroundPattern />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="glassmorphism rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl flex flex-col items-center justify-center relative z-10 backdrop-blur-2xl">
        <LoginSection selectedRole={selectedRole} />
      </div>

      <RoleSelector
        selectedRole={selectedRole}
        onRoleSelect={setSelectedRole}
      />
    </div>
  );
};