import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Building2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import fetchClient from '../../lib/fetchClient';
import { formatXAF } from '../../utils/currency';

interface QuickStats {
  totalStudents: number;
  totalRevenue: number;
  pendingPayments: number;
  activeBranches: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

export const QuickStatsBar: React.FC = () => {
  const { user, can } = useAuth();
  const { currentBranch } = useBranch();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickStats();
  }, [currentBranch]);

  const fetchQuickStats = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from multiple endpoints
      const params = new URLSearchParams();
      if (currentBranch && !(user as any)?.isSuperAdmin) {
        params.append('branch', (currentBranch as any)._id);
      }

      const requests: Array<Promise<Response>> = [];
      // Only fetch what user can see
      if (can('students','read')) requests.push(fetchClient.get(`/api/students/stats/overview?${params.toString()}`)); else requests.push(Promise.resolve(new Response('{}', { status: 200 })));
      if (can('accounting','read')) requests.push(fetchClient.get(`/api/transactions/summary?${params.toString()}`)); else requests.push(Promise.resolve(new Response('{}', { status: 200 })));
      if ((user as any)?.isSuperAdmin && can('branches','read')) requests.push(fetchClient.get('/api/branches')); else requests.push(Promise.resolve(new Response('[]', { status: 200 })));

      const [studentsRes, financeRes, branchesRes] = await Promise.all(requests);
      const studentsData = studentsRes.ok ? await studentsRes.json() : {};
      const financeData = financeRes.ok ? await financeRes.json() : {};
      const branchesData = branchesRes.ok ? await branchesRes.json() : {};

      const branches = Array.isArray(branchesData) ? branchesData : (branchesData.data || []);

      setStats({
        totalStudents: studentsData.data?.total ?? studentsData.total ?? 0,
        totalRevenue: financeData.data?.totalIncome ?? financeData.summary?.totalIncome ?? 0,
        pendingPayments: studentsData.data?.tuition?.pending ?? studentsData.tuition?.pending ?? 0,
        activeBranches: Array.isArray(branches) ? branches.filter((b: any) => b.isActive).length : 0,
        systemHealth: 'good'
      });
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
      setStats({
        totalStudents: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        activeBranches: 0,
        systemHealth: 'warning'
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700 px-6 py-3 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Students */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Students:</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats?.totalStudents || 0}</span>
          </div>

          {/* Revenue */}
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue:</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatXAF(stats?.totalRevenue || 0)}</span>
          </div>

          {/* Pending Payments */}
          {stats && stats.pendingPayments > 0 && (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending:</span>
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{stats.pendingPayments}</span>
            </div>
          )}

          {/* Branches (SuperAdmin only) */}
          {(user as any)?.isSuperAdmin && (
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Branches:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats?.activeBranches || 0}</span>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System:</span>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            stats ? getHealthColor(stats.systemHealth) : 'bg-gray-100 text-gray-800'
          }`}>
            {stats && getHealthIcon(stats.systemHealth)}
            <span className="capitalize">{stats?.systemHealth || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};