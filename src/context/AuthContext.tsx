import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  permissions: string[];
  department?: string;
  employeeId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getRolePermissions = (role: string): string[] => {
    switch (role) {
      case 'SuperAdmin':
        return ['all'];
      case 'Admin':
        return ['students', 'fees', 'reports', 'announcements', 'branches', 'programs', 'departments'];
      case 'Lecturer':
        return ['students', 'grades', 'attendance', 'courses', 'academic_reports'];
      case 'Accountant':
        return ['fees', 'payments', 'financial_reports', 'accounting'];
      case 'Dean of Studies':
        return ['students', 'courses', 'programs', 'academic_reports', 'grades', 'departments'];
      case 'Head Of Department':
        return ['department_students', 'department_courses', 'department_reports', 'grades', 'attendance'];
      default:
        return [];
    }
  };

  const login = async (username: string, password: string, role: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - accept any credentials for demo
    if (username && password) {
      const mockUser: User = {
        id: '1',
        username,
        email: `${username}@unhimas.edu.cm`,
        role,
        firstName: getFirstName(role),
        lastName: 'User',
        permissions: getRolePermissions(role),
        department: getDepartment(role),
        employeeId: `EMP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const getFirstName = (role: string): string => {
    switch (role) {
      case 'SuperAdmin': return 'Super';
      case 'Admin': return 'Admin';
      case 'Lecturer': return 'Prof.';
      case 'Accountant': return 'Finance';
      case 'Dean of Studies': return 'Dean';
      case 'Head Of Department': return 'HOD';
      default: return 'User';
    }
  };

  const getDepartment = (role: string): string => {
    switch (role) {
      case 'Lecturer': return 'Computer Engineering';
      case 'Accountant': return 'Finance Department';
      case 'Dean of Studies': return 'Academic Affairs';
      case 'Head Of Department': return 'Computer Engineering';
      default: return 'Administration';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};