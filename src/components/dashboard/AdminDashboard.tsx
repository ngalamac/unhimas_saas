import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Building2, CreditCard, AlertCircle, Shield, Database, UserPlus, PlusCircle, Settings } from 'lucide-react';
import { formatXAF } from '../../utils/currency';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { isFinanceRole } from '../../utils/rolePermissions';
import fetchClient from '../../lib/fetchClient';
import { ModernStatsCard } from './modern/ModernStatsCard';
import { QuickActionCard, QuickAction } from './modern/QuickActionCard';
import { ActivityFeed, Activity } from './modern/ActivityFeed';
import { SystemStatusCard, SystemStatus } from './modern/SystemStatusCard';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { managedBranches, currentBranch, setCurrentBranchById } = useBranch();
  const { setCurrentPage } = useNavigation();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeBranches: 0
  });
  const [loading, setLoading] = useState(true);
  const isFinance = isFinanceRole(((user as any)?.role || (user as any)?.type) as string);

  // Fetch real data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch student statistics
        const studentParams = new URLSearchParams();
        if (currentBranch && !user?.isSuperAdmin) {
          studentParams.append('branch', currentBranch._id);
        }
        const studentResponse = await fetchClient.get(`/api/students/stats/overview?${studentParams}`);
        const studentBody = await studentResponse.json();
        const studentStats = studentBody.data;

        // Fetch financial data
        const financeParams = new URLSearchParams();
        if (currentBranch && !user?.isSuperAdmin) {
          financeParams.append('branch', currentBranch._id);
        }
        const financeResponse = await fetchClient.get(`/api/transactions/summary?${financeParams}`);
        const financeBody = await financeResponse.json();
        const financeStats = financeBody.data;

        // Fetch branch data
        const branchResponse = await fetchClient.get('/api/branches');
        const branchData = await branchResponse.json();
        const branches = Array.isArray(branchData) ? branchData : (branchData.data || []);

        setStats({
          totalStudents: studentStats.total || 0,
          totalStaff: studentStats.totalStaff || 0,
          totalRevenue: financeStats.totalIncome || 0,
          pendingPayments: financeStats.pendingTransactions || 0,
          activeBranches: branches.filter((b: any) => b.isActive).length
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentBranch, user?.isSuperAdmin]);

  const isManagerViewingUnassigned = currentBranch && managedBranches.length > 0 && !managedBranches.find(b => (b as any)._id === (currentBranch as any)._id || (b as any).id === (currentBranch as any).id);

  // Account Management State
  // Reduce sensitive admin-only controls from non-superadmin dashboards
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState('');
  const adminEmail = 'youremail'; // Replace with dynamic value if available

  const formatCurrency = (amount: number) => formatXAF(amount);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  // Trigger password reset for admin/superadmin
  const handleAdminPasswordReset = async () => {
    setResetLoading(true);
    setResetMsg('');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/auth/panel-reset-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json();
      setResetMsg(data.message || 'If authorized, you will receive a password reset email.');
    } catch {
      setResetMsg('Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'add-student',
      title: 'Add New Student',
      description: 'Register a new student in the system',
      icon: UserPlus,
      onClick: () => setCurrentPage('student-registration'),
      gradient: 'blue'
    },
    ...(user?.isSuperAdmin ? [{
      id: 'create-branch',
      title: 'Create Branch',
      description: 'Add a new branch location',
      icon: Building2,
      onClick: () => setCurrentPage('create-branch'),
      gradient: 'green' as const
    }] : []),
    {
      id: 'add-program',
      title: 'Add Program',
      description: 'Create new academic program',
      icon: GraduationCap,
      onClick: () => setCurrentPage('programs'),
      gradient: 'purple'
    },
    {
      id: 'manage-users',
      title: 'Manage Users',
      description: 'User roles and permissions',
      icon: Settings,
      onClick: () => setCurrentPage('user-management'),
      gradient: 'orange'
    }
  ];

  const recentActivities: Activity[] = [
    {
      id: '1',
      title: 'New Student Registered',
      description: 'John Doe enrolled in Computer Engineering',
      timestamp: '2 minutes ago',
      type: 'success',
      icon: Users,
      user: 'Admin'
    },
    {
      id: '2',
      title: 'Payment Received',
      description: 'Tuition payment of 525,000 XAF processed',
      timestamp: '5 minutes ago',
      type: 'success',
      icon: CreditCard
    },
    {
      id: '3',
      title: 'Announcement Sent',
      description: 'Campus event notification sent to all students',
      timestamp: '10 minutes ago',
      type: 'info',
      icon: AlertCircle
    }
  ];

  const systemStatuses: SystemStatus[] = [
    {
      id: 'db',
      name: 'Database',
      status: 'online',
      lastChecked: 'Just now',
      details: 'PostgreSQL cluster healthy'
    },
    {
      id: 'payment',
      name: 'Payment Gateway',
      status: 'online',
      lastChecked: '1 min ago',
      details: 'All transactions processing'
    },
    {
      id: 'sms',
      name: 'SMS Service',
      status: 'online',
      lastChecked: '2 min ago',
      details: 'Message queue: 0'
    },
    {
      id: 'email',
      name: 'Email Service',
      status: 'online',
      lastChecked: '30 sec ago',
      details: 'SMTP server connected'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Administrative overview and management</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {currentBranch?.name || 'All Branches'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Branch switcher for managers */}
      {managedBranches.length > 0 && (
        <div className="mb-4 flex items-center space-x-4">
          <label className="text-sm text-gray-700">Viewing branch:</label>
          <select
            value={(currentBranch as any)?._id || (currentBranch as any)?.id || ''}
            onChange={(e) => setCurrentBranchById(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {managedBranches.map(b => (
              <option key={(b as any)._id || (b as any).id} value={(b as any)._id || (b as any).id}>{b.name}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600">{currentBranch ? `Currently: ${currentBranch.name}` : 'No branch selected'}</div>
        </div>
      )}

      {isManagerViewingUnassigned && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-300 text-yellow-800">
          You are viewing a branch you are not assigned to. Some actions may be read-only.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ModernStatsCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Active enrollments"
          icon={Users}
          gradient="blue"
          trend={{ value: '+12%', isPositive: true }}
          onClick={() => setCurrentPage('all-students')}
        />

        <ModernStatsCard
          title="Active Branches"
          value={stats.activeBranches}
          subtitle="All operational"
          icon={Building2}
          gradient="emerald"
          onClick={() => setCurrentPage('view-branches')}
        />

        {isFinance && (
          <ModernStatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtitle="This month"
            icon={CreditCard}
            gradient="purple"
            trend={{ value: '+8%', isPositive: true }}
            onClick={() => setCurrentPage('accounting-overview')}
          />
        )}

        {isFinance && (
          <ModernStatsCard
            title="Pending Payments"
            value={stats.pendingPayments}
            subtitle="Requires attention"
            icon={AlertCircle}
            gradient="orange"
            onClick={() => setCurrentPage('transactions')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActionCard actions={quickActions} />
        <ActivityFeed activities={recentActivities} />
        <SystemStatusCard statuses={systemStatuses} />
      </div>

      {/* Account Management Interface (SuperAdmin only) */}
      {user?.isSuperAdmin && (
      <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <div>
              <span className="font-medium text-gray-700">Admin Email:</span>
              <span className="ml-2 text-gray-900">{adminEmail}</span>
            </div>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold shadow"
              onClick={handleAdminPasswordReset}
              disabled={resetLoading}
            >
              {resetLoading ? 'Sending...' : 'Reset Password'}
            </button>
            {resetMsg && <span className="text-green-700 font-medium ml-4">{resetMsg}</span>}
          </div>
        </div>
      )}

      {/* Branch Overview (visible to managers and SuperAdmin only) */}
      {(user?.isSuperAdmin || managedBranches.length > 0) && (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {managedBranches.length > 0 ? (
            managedBranches.map((branch) => (
              <div key={branch._id || branch.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{branch.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    branch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Students: {branch.studentCount || 0}</div>
                  <div>Staff: {branch.staffCount || 0}</div>
                  <div>Manager: {((branch.manager as any)?.firstName ? `${(branch.manager as any).firstName} ${(branch.manager as any).lastName || ''}` : ((branch.manager as any).name || '—'))}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              {user?.isSuperAdmin ? 'No branches created yet' : 'No branches assigned to you'}
            </div>
          )}
        </div>
      </div>
        )}
      </div>
  );
};
