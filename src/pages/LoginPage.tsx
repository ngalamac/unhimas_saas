import React, { useState } from 'react';
import { BackgroundPattern } from '../components/layout/BackgroundPattern';
import { WelcomeSection } from '../components/auth/WelcomeSection';
import { LoginSection } from '../components/auth/LoginSection';
import { RoleSelector } from '../components/auth/RoleSelector';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('SuperAdmin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex flex-col lg:items-center lg:justify-center p-2 sm:p-4 lg:p-8">
      {/* Background pattern overlay */}
      <BackgroundPattern />

      {/* Main login container */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-col lg:flex-row relative z-10">
        {/* Left side - Welcome section */}
        <WelcomeSection />

        {/* Right side - Login form */}
        <LoginSection selectedRole={selectedRole} />
      </div>

      {/* Bottom role selection */}
      <RoleSelector 
        selectedRole={selectedRole} 
        onRoleSelect={setSelectedRole} 
      />
    </div>
  );
};