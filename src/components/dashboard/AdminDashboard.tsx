import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Building2, CreditCard, AlertCircle } from 'lucide-react';
import { formatXAF } from '../../utils/currency';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import fetchClient from '../../lib/fetchClient';

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
        const studentStats = await studentResponse.json();

        // Fetch financial data
        const financeParams = new URLSearchParams();
        if (currentBranch && !user?.isSuperAdmin) {
          financeParams.append('branch', currentBranch._id);
        }
        const financeResponse = await fetchClient.get(`/api/accounting/summary/overview?${financeParams}`);
        const financeStats = await financeResponse.json();

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
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState('');
  const adminEmail = 'superadminunhimas@gmail.com'; // Replace with dynamic value if available

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

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Administrative overview and management</p>
          <p className="text-sm text-blue-600">Branch: {currentBranch?.name || 'All Branches'}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{new Date().toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
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

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              <p className="text-xs text-green-600">↗ +12% this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Branches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeBranches}</p>
              <p className="text-xs text-blue-600">All operational</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600">↗ +8% this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
              <p className="text-xs text-orange-600">Requires attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setCurrentPage('student-registration')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Add New Student</span>
            </button>
            {user?.isSuperAdmin && (
              <button 
                onClick={() => setCurrentPage('create-branch')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Building2 className="w-4 h-4" />
                <span>Create Branch</span>
              </button>
            )}
            <button 
              onClick={() => setCurrentPage('programs')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Add Program</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>New student registered</span>
              <span className="text-gray-500 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Payment processed</span>
              <span className="text-gray-500 ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Announcement sent</span>
              <span className="text-gray-500 ml-auto">10 min ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Gateway</span>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SMS Service</span>
              <span className="text-sm text-green-600 font-medium">Running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Service</span>
              <span className="text-sm text-green-600 font-medium">Running</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management Interface */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
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

      {/* Branch Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
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
    </>
  );
};