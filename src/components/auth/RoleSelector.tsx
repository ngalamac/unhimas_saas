import React from 'react';
import { useTranslation } from '../../context/TranslationContext';

interface Role {
  name: string;
  active: boolean;
}

interface School {
  name: string;
  roles: Role[];
}

interface RoleSelectorProps {
  selectedRole: string;
  onRoleSelect: (role: string) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect }) => {
  const { t } = useTranslation();

  const roles: Role[] = [
    { name: 'SuperAdmin', active: true },
    { name: 'Admin', active: false },
    { name: 'Registrar', active: false },
    { name: 'Accountant', active: false },
    { name: 'Dean of Studies', active: false },
    { name: 'Head Of Department', active: false }
  ];

  const schools: School[] = [
    { name: t('auth.login.selectRole'), roles: roles }
  ];

  return (
    <div className="mt-4 sm:mt-6 lg:mt-8 w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl relative z-10">
      <div className="space-y-3 sm:space-y-4">
        {schools.map((school, schoolIndex) => (
          <div key={schoolIndex} className="text-center">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">{school.name}</h3>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              {school.roles.map((role, roleIndex) => (
                <button
                  key={roleIndex}
                  onClick={() => onRoleSelect(role.name)}
                  className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded transition-colors outline-none focus:ring-2 focus:ring-[#a02c2c] ${
                    role.name === selectedRole
                      ? 'bg-[#a02c2c] text-white border-2 border-[#a02c2c] shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};