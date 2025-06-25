import React, { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // For demo purposes, we'll show the dashboard directly
  // In a real app, this would be handled by authentication state
  const showDashboard = true; // Change to false to show login page

  if (showDashboard || isLoggedIn) {
    return <SuperAdminDashboard />;
  }

  return <LoginPage />;
}

export default App;