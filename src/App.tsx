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
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  const router = createBrowserRouter([
    { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
    { path: '/password-reset', element: <PublicRoute><PasswordResetPage /></PublicRoute> },
    { path: '/dashboard/*', element: <ProtectedRoute><SuperAdminDashboard /></ProtectedRoute> },
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
    try {
      const envAny = (import.meta as any)?.env || {};
      // Visible in browser console for quick verification
      // Note: Values are baked at build time
      console.info('[Diag] VITE_API_BASE_URL =', envAny?.VITE_API_BASE_URL || null);
      console.info('[Diag] VITE_BACKEND_URL =', envAny?.VITE_BACKEND_URL || null);
      console.info('[Diag] MODE/DEV =', envAny?.MODE, envAny?.DEV);
      console.info('[Diag] window.origin =', window.location.origin);
    } catch {}

    // Trigger a single health check so Network tab shows one request
    fetchClient
      .get('/api/health')
      .then((res) => console.info('[Diag] GET /api/health -> status', res.status))
      .catch((err) => console.warn('[Diag] GET /api/health -> error', err?.message || err));
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