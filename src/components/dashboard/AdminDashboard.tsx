import React from 'react';
import BranchWelcomeSwitcher from './BranchWelcomeSwitcher';
import { Users, GraduationCap, Building2, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id ?? (user as any)?._id;
  const [branches, setBranches] = React.useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = React.useState(false);
  const activeBranches = branches.filter(b => b.isActive).length;
  // TODO: Fetch students/payments from backend if needed
  const totalStudents = 0;
  const totalRevenue = 0;
  const pendingPayments = 0;

  // Account Management State
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState('');
  const adminEmail = 'superadminunhimas@gmail.com'; // Replace with dynamic value if available

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <>
      <BranchWelcomeSwitcher userId={currentUserId} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-200">Administrative overview and management</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-200">{new Date().toLocaleDateString()}</div>
          <div className="text-xs text-gray-500 dark:text-gray-300">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Total Students */}
  <div className="bg-white dark:bg-darkbg p-6 rounded-lg shadow-sm border dark:border-gray-700 dark:text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-200">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
              <p className="text-xs text-green-600 dark:text-green-400">↗ +12% this month</p>
            </div>
          </div>
        </div>
        {/* Active Branches */}
  <div className="bg-white dark:bg-darkbg p-6 rounded-lg shadow-sm border dark:border-gray-700 dark:text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-200">Active Branches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeBranches}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">All operational</p>
            </div>
          </div>
        </div>
        {/* Total Revenue */}
  <div className="bg-white dark:bg-darkbg p-6 rounded-lg shadow-sm border dark:border-gray-700 dark:text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-200">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-600 dark:text-green-400">↗ +8% this month</p>
            </div>
          </div>
        </div>
        {/* Pending Payments */}
  <div className="bg-white dark:bg-darkbg p-6 rounded-lg shadow-sm border dark:border-gray-700 dark:text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-200">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingPayments}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Requires attention</p>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Actions, Recent Activities, System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Actions */}
  <div className="bg-white dark:bg-darkbg p-6 rounded-lg shadow-sm border dark:border-gray-700 dark:text-white">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Add New Student</span>
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2" onClick={() => navigate('/branches/create')}>
              <Building2 className="w-4 h-4" />
              <span>Create Branch</span>
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span>Add Program</span>
            </button>
          </div>
        </div>
        {/* Recent Activities */}
  <div className="bg-white dark:bg-darkbg p-6 rounded-lg shadow-sm border dark:border-gray-700 dark:text-white">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="dark:text-white">New student registered</span>
              <span className="text-gray-500 dark:text-gray-300 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="dark:text-white">Payment processed</span>
              <span className="text-gray-500 dark:text-gray-300 ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="dark:text-white">Announcement sent</span>
              <span className="text-gray-500 dark:text-gray-300 ml-auto">10 min ago</span>
            </div>
          </div>
        </div>
        {/* System Status */}
  <div className="bg-white dark:bg-darkbg p-6 rounded-lg shadow-sm border dark:border-gray-700 dark:text-white">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-200">Database</span>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-200">Payment Gateway</span>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-200">SMS Service</span>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-200">Email Service</span>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Running</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}