import React, { useState, useEffect } from 'react';
import { Shield, Users, Eye, AlertTriangle, CheckCircle, Activity, Clock, Building2, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import fetchClient from '../../lib/fetchClient';

interface AccessStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentLogins: number;
  failedLogins: number;
  roleDistribution: Array<{ role: string; count: number; percentage: number }>;
  branchDistribution: Array<{ branch: string; count: number }>;
  permissionUsage: Array<{ feature: string; users: number; percentage: number }>;
  recentActivity: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

const AccessControlDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const [stats, setStats] = useState<AccessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAccessStats();
  }, [timeRange]);

  const fetchAccessStats = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive access control data
      const mockStats: AccessStats = {
        totalUsers: 89,
        activeUsers: 76,
        inactiveUsers: 13,
        recentLogins: 45,
        failedLogins: 3,
        roleDistribution: [
          { role: 'Lecturer', count: 45, percentage: 50.6 },
          { role: 'Admin', count: 8, percentage: 9.0 },
          { role: 'Accountant', count: 12, percentage: 13.5 },
          { role: 'Dean of Studies', count: 3, percentage: 3.4 },
          { role: 'Head Of Department', count: 6, percentage: 6.7 },
          { role: 'SuperAdmin', count: 1, percentage: 1.1 },
          { role: 'Other', count: 14, percentage: 15.7 }
        ],
        branchDistribution: [
          { branch: 'Main Campus', count: 45 },
          { branch: 'Yaoundé Branch', count: 28 },
          { branch: 'Bamenda Branch', count: 12 },
          { branch: 'Bafoussam Branch', count: 4 }
        ],
        permissionUsage: [
          { feature: 'students', users: 67, percentage: 75.3 },
          { feature: 'accounting', users: 23, percentage: 25.8 },
          { feature: 'courses', users: 51, percentage: 57.3 },
          { feature: 'grades', users: 48, percentage: 53.9 },
          { feature: 'reports', users: 34, percentage: 38.2 },
          { feature: 'communication', users: 19, percentage: 21.3 }
        ],
        recentActivity: [
          { id: '1', user: 'Dr. Jean Mbarga', action: 'Updated student record', timestamp: '2 minutes ago', status: 'success' },
          { id: '2', user: 'Prof. Marie Nkomo', action: 'Failed login attempt', timestamp: '5 minutes ago', status: 'warning' },
          { id: '3', user: 'Admin User', action: 'Created new user account', timestamp: '12 minutes ago', status: 'success' },
          { id: '4', user: 'Finance Officer', action: 'Generated financial report', timestamp: '18 minutes ago', status: 'success' },
          { id: '5', user: 'System', action: 'Permission denied for unauthorized access', timestamp: '25 minutes ago', status: 'error' }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      showToast('Failed to load access statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Access Control Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor user access, permissions, and security</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-blue-100 text-xs mt-1">System-wide</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                  <p className="text-green-100 text-xs mt-1">
                    {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Recent Logins</p>
                  <p className="text-2xl font-bold">{stats.recentLogins}</p>
                  <p className="text-purple-100 text-xs mt-1">Last {timeRange}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Activity className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Failed Logins</p>
                  <p className="text-2xl font-bold">{stats.failedLogins}</p>
                  <p className="text-red-100 text-xs mt-1">Security alerts</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Role Distribution</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.roleDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'][index % 7]
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900">{item.role}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'][index % 7]
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Permission Usage */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Permission Usage</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.permissionUsage.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 capitalize">{item.feature}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{item.users}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Security Activity</h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className={`p-6 border-l-4 ${getActivityColor(activity.status)}`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">by {activity.user}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Access Overview */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Branch Access Distribution</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.branchDistribution.map((branch, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{branch.branch}</p>
                        <p className="text-lg font-bold text-gray-900">{branch.count}</p>
                        <p className="text-xs text-gray-500">users</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccessControlDashboard;