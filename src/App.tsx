import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import PasswordResetPage from './pages/PasswordResetPage';
import fetchClient from './lib/fetchClient';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <>{children}</>;
  // Ensure the dashboard landing honors role; RoleDashboard handles selection internally
  return <Navigate to="/dashboard" replace />;
};

// Helpers for role <-> path segment mapping
const roleToSegment = (role?: string): string => {
  switch (role) {
    case 'SuperAdmin':
      return 'superadmin';
    case 'Admin':
      return 'admin';
    case 'Lecturer':
      return 'lecturer';
    case 'Accountant':
      return 'accountant';
    case 'Dean of Studies':
      return 'dean';
    case 'Head Of Department':
      return 'hod';
    default:
      return 'superadmin';
  }
};

const segmentToRole = (seg: string): string => {
  switch (seg) {
    case 'superadmin':
      return 'SuperAdmin';
    case 'admin':
      return 'Admin';
    case 'lecturer':
      return 'Lecturer';
    case 'accountant':
      return 'Accountant';
    case 'dean':
      return 'Dean of Studies';
    case 'hod':
      return 'Head Of Department';
    default:
      return 'SuperAdmin';
  }
};

// Redirect /dashboard to the correct nested path based on role
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const seg = roleToSegment(user?.role);
  return <Navigate to={`/dashboard/${seg}`} replace />;
};

// Gate that ensures the nested route matches the user's role; otherwise redirect
const RoleGate: React.FC<{ expectedSegment: string; children: React.ReactNode }> = ({ expectedSegment, children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const expectedRole = segmentToRole(expectedSegment);
  if ((user?.role || '') !== expectedRole) {
    const seg = roleToSegment(user?.role);
    return <Navigate to={`/dashboard/${seg}`} replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  const router = createBrowserRouter([
    { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
    { path: '/password-reset', element: <PublicRoute><PasswordResetPage /></PublicRoute> },
    // Role-aware dashboard routing
    { path: '/dashboard', element: <ProtectedRoute><DashboardRouter /></ProtectedRoute> },
    { path: '/dashboard/superadmin/*', element: <ProtectedRoute><RoleGate expectedSegment="superadmin"><SuperAdminDashboard /></RoleGate></ProtectedRoute> },
    { path: '/dashboard/admin/*', element: <ProtectedRoute><RoleGate expectedSegment="admin"><SuperAdminDashboard /></RoleGate></ProtectedRoute> },
    { path: '/dashboard/accountant/*', element: <ProtectedRoute><RoleGate expectedSegment="accountant"><SuperAdminDashboard /></RoleGate></ProtectedRoute> },
    { path: '/dashboard/lecturer/*', element: <ProtectedRoute><RoleGate expectedSegment="lecturer"><SuperAdminDashboard /></RoleGate></ProtectedRoute> },
    { path: '/dashboard/dean/*', element: <ProtectedRoute><RoleGate expectedSegment="dean"><SuperAdminDashboard /></RoleGate></ProtectedRoute> },
    { path: '/dashboard/hod/*', element: <ProtectedRoute><RoleGate expectedSegment="hod"><SuperAdminDashboard /></RoleGate></ProtectedRoute> },
    // Fallbacks
    { path: '/dashboard/*', element: <ProtectedRoute><DashboardRouter /></ProtectedRoute> },
    { path: '/', element: <Navigate to="/login" replace /> },
    { path: '*', element: <Navigate to="/login" replace /> }
  ], {
    // Opt-in to React Router v7 future behaviors to silence splat warning
    future: {
      v7_relativeSplatPath: true
    }
  });

  return <RouterProvider router={router} />;
}

function App() {
  // Diagnostics: log env and ping health once to verify API base & connectivity
  useEffect(() => {
    // Only run diagnostics when explicitly enabled at runtime
    const debug = (() => { try { return Boolean((window as any).__API_DEBUG__); } catch { return false; } })();
    if (!debug) return;

  try {
      const envAny = (import.meta as any)?.env || {};
      console.info('[Diag] VITE_API_BASE_URL =', envAny?.VITE_API_BASE_URL || null);
      console.info('[Diag] VITE_BACKEND_URL =', envAny?.VITE_BACKEND_URL || null);
      console.info('[Diag] MODE/DEV =', envAny?.MODE, envAny?.DEV);
      console.info('[Diag] window.origin =', window.location.origin);
      const resolvedBase = (envAny?.VITE_API_BASE_URL || envAny?.VITE_BACKEND_URL || (envAny?.DEV ? 'http://localhost:5000' : ''))
        ?.toString()
        .replace(/\/$/, '');
      console.info('[Diag] resolved API base =', resolvedBase || '(same-origin)');
    } catch {}

    fetchClient
      .get('/api/health')
      .then((res) => console.info('[Diag] GET /api/health -> status', res.status))
      .catch((err) => console.warn('[Diag] GET /api/health -> error', err?.message || err));

    try {
      const envAny = (import.meta as any)?.env || {};
      const base = (envAny?.VITE_API_BASE_URL || envAny?.VITE_BACKEND_URL || '')?.toString().replace(/\/$/, '');
      if (base) {
        fetch(base + '/api/health', { method: 'HEAD', mode: 'no-cors' })
          .then(() => console.info('[Diag] HEAD(no-cors) /api/health -> ok (opaque)'))
          .catch((e) => console.warn('[Diag] HEAD(no-cors) /api/health -> network error', e?.message || e));
      }
    } catch {}

  // Comprehensive connectivity diagnostics (single shot)
  fetchClient.diagnoseConnectivity?.();
  }, []);

  return (
    <AuthProvider>
      <BranchProvider>
        <AppRoutes />
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;