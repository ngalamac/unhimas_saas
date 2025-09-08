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
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

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
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
      const body = await res.json();
      if (res.ok && body.data.token && body.data.user) {
        const { token, user: userData } = body.data;
        // Optionally check role match
        if (role && userData.type !== role) {
          return false;
        }
        // Only include features with at least one action set to true
        // Extract granular permissions: 'feature:action' for all actions set to true
        const featurePermissions = Object.entries(userData.permissions || {})
          .flatMap(([feature, actions]) => {
            if (!actions || typeof actions !== 'object') return [];
            return Object.entries(actions)
              .filter(([action, value]) => value === true)
              .map(([action]) => `${feature.toLowerCase()}:${action.toLowerCase()}`);
          });
        // Defensive name parsing in case name is missing or single-token
        const fullName = typeof userData.name === 'string' ? userData.name.trim() : '';
        const nameParts = fullName ? fullName.split(/\s+/) : [];
        const user = {
          id: userData._id,
          username: userData.name || '',
          email: userData.email || '',
          role: userData.type || '',
          firstName: nameParts[0] || '',
          lastName: nameParts[1] || '',
          permissions: featurePermissions,
          department: userData.department || '',
          employeeId: userData.employeeId || '',
        };
        setUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
  setUser(null);
  setIsAuthenticated(false);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
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