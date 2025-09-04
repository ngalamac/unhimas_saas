import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { AdminDashboard } from './AdminDashboard';
import { LecturerDashboard } from './LecturerDashboard';
import { AccountantDashboard } from './AccountantDashboard';
import { DeanDashboard } from './DeanDashboard';
import { HODDashboard } from './HODDashboard';

export const RoleDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'SuperAdmin':
      return <SuperAdminDashboard />;
    case 'Admin':
      return <AdminDashboard />;
    case 'Lecturer':
      return <LecturerDashboard />;
    case 'Accountant':
      return <AccountantDashboard />;
    case 'Dean of Studies':
      return <DeanDashboard />;
    case 'Head Of Department':
      return <HODDashboard />;
    default:
      return <SuperAdminDashboard />;
  }
};