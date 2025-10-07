import React from 'react';

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
  const roles: Role[] = [
    { name: 'SuperAdmin', active: true },
    { name: 'Admin', active: false },
    { name: 'Registrar', active: false },
    { name: 'Accountant', active: false },
    { name: 'Dean of Studies', active: false },
    { name: 'Head Of Department', active: false }
  ];

  const schools: School[] = [
    { name: 'Select your role to login', roles: roles }
  ];

  return (
    <div className="mt-6 sm:mt-8 lg:mt-10 w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl relative z-10">
      <div className="space-y-4 sm:space-y-5">
        {schools.map((school, schoolIndex) => (
          <div key={schoolIndex} className="text-center">
            <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">{school.name}</h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {school.roles.map((role, roleIndex) => (
                <button
                  key={roleIndex}
                  onClick={() => onRoleSelect(role.name)}
                  className={`px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 transform ${
                    role.name === selectedRole
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105 ring-2 ring-blue-400 ring-offset-2'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105 hover:shadow-md'
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