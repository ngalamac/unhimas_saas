import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getBase } from '../lib/fetchClient';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  // Flattened permissions like feature:action for quick checks (legacy support)
  permissions: string[];
  // Raw nested permission map from backend
  rawPermissions: Record<string, Record<string, boolean>>;
  department?: string;
  employeeId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role?: string) => Promise<boolean>;
  logout: () => void;
  // Backwards compatible single string check ("feature:action")
  hasPermission: (permission: string) => boolean;
  // New granular check
  can: (feature: string, action: string) => boolean;
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

  // Listen for permission updates (other tabs/components) and refresh user from latest backend if needed later.
  useEffect(() => {
    const handler = () => {
      // For now just re-read from localStorage (could be extended to refetch /me endpoint)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch {}
      }
    };
    window.addEventListener('permissionsUpdated', handler as EventListener);
    return () => window.removeEventListener('permissionsUpdated', handler as EventListener);
  }, []);


  const login = async (username: string, password: string, role?: string): Promise<boolean> => {
    try {
  const base = getBase();
  const api = `${base}/api/auth/login`;
  const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
  const body = await res.json();
  // Backend returns { token, user } (no data wrapper). Support both shapes.
  const token = body?.data?.token || body?.token;
  const userData = body?.data?.user || body?.user;
  if (res.ok && token && userData) {
        // Optionally check role match
        if (role && userData.type !== role) {
          return false;
        }
        // Only include features with at least one action set to true
        // Extract granular permissions: 'feature:action' for all actions set to true
  const rawPermissions: Record<string, Record<string, boolean>> = userData.permissions || {};
  const featurePermissions = Object.entries(rawPermissions || {})
          .flatMap(([feature, actions]) => {
            if (!actions || typeof actions !== 'object') return [];
            return Object.entries(actions)
              .filter(([, value]) => value === true)
              .map(([action]) => `${feature.toLowerCase()}:${action.toLowerCase()}`);
          });
        // Defensive name parsing in case name is missing or single-token
        const fullName = typeof userData.name === 'string' ? userData.name.trim() : '';
        const nameParts = fullName ? fullName.split(/\s+/) : [];
        const user: User = {
          id: userData._id,
          username: userData.name || '',
          email: userData.email || '',
          role: userData.type || '',
          firstName: nameParts[0] || '',
          lastName: nameParts[1] || '',
          permissions: featurePermissions,
          rawPermissions: rawPermissions,
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
    return user.permissions.includes(permission.toLowerCase());
  };

  const can = (feature: string, action: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    const f = feature.toLowerCase();
    const a = action.toLowerCase();
    return !!user.rawPermissions?.[f]?.[a];
  };


  return (
  <AuthContext.Provider value={{ user, isAuthenticated, login, logout, hasPermission, can }}>
      {children}
    </AuthContext.Provider>
  );
};