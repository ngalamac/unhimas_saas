import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import PasswordResetPage from './pages/PasswordResetPage';

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
  return (
    <AuthProvider>
      <BranchProvider>
        <AppRoutes />
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;