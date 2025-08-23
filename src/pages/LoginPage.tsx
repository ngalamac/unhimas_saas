import React, { useState } from 'react';
import { BackgroundPattern } from '../components/layout/BackgroundPattern';
import { WelcomeSection } from '../components/auth/WelcomeSection';
import { LoginSection } from '../components/auth/LoginSection';
import { RoleSelector } from '../components/auth/RoleSelector';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('SuperAdmin');

  return (
  <div className="min-h-screen bg-white flex flex-col lg:items-center lg:justify-center p-2 sm:p-4 lg:p-8">
      {/* Background pattern overlay */}
      <BackgroundPattern />

      {/* Main login container: Only login section, no sidebar */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl flex flex-col items-center justify-center relative z-10">
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