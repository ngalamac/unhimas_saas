export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'SuperAdmin'
  | 'Admin'
  | 'Lecturer'
  | 'Accountant'
  | 'Dean of Studies'
  | 'Head Of Department';

export interface LoginCredentials {
  username: string;
  password: string;
  role: UserRole;
  rememberMe: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}