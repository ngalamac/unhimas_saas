import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, GraduationCap, Building2, Calendar, Filter, Download } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';

interface AnalyticsData {
  students: {
    total: number;
    active: number;
    graduated: number;
    byGender: Array<{ _id: string; count: number }>;
    byProgram: Array<{ _id: string; count: number }>;
    byTuitionStatus: Array<{ _id: string; count: number }>;
    monthlyTrend: Array<{ month: string; count: number }>;
  };
  staff: {
    total: number;
    active: number;
    byType: Array<{ _id: string; count: number }>;
    byDepartment: Array<{ _id: string; count: number }>;
  };
  financial: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    monthlyIncome: Array<{ month: string; amount: number }>;
    monthlyExpenses: Array<{ month: string; amount: number }>;
    byCategory: Array<{ _id: string; amount: number }>;
  };
  branches: {
    total: number;
    active: number;
    studentDistribution: Array<{ _id: string; name: string; count: number }>;
    staffDistribution: Array<{ _id: string; name: string; count: number }>;
  };
}

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { showToast } = useUI();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('');

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        ...(selectedBranchFilter && { branch: selectedBranchFilter })
      });

      const [studentsRes, staffRes, financialRes, branchesRes] = await Promise.all([
        fetchClient.get(`/api/students/stats/overview?${params}`),
        fetchClient.get(`/api/staff/stats/overview?${params}`),
        fetchClient.get(`/api/accounting/summary/overview?${params}`),
        fetchClient.get(`/api/branches/stats/overview?${params}`)
      ]);

      const [studentsData, staffData, financialData, branchesData] = await Promise.all([
        studentsRes.json(),
        staffRes.json(),
        financialRes.json(),
        branchesRes.json()
      ]);

      setAnalyticsData({
        students: studentsData,
        staff: staffData,
        financial: financialData.summary || financialData,
        branches: branchesData
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
      showToast('Failed to fetch analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedBranchFilter]);

  const handleExportAnalytics = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        from: dateRange.from,
        to: dateRange.to,
        ...(selectedBranchFilter && { branch: selectedBranchFilter })
      });

      const response = await fetchClient.get(`/api/analytics/export?${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Analytics exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export analytics', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-CM').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading analytics</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and statistics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExportAnalytics('csv')}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExportAnalytics('xlsx')}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {user?.type === 'SuperAdmin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Branches</option>
                {/* This would be populated from branches API */}
              </select>
            </div>
          )}
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.students.total)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.staff.total)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Branches</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.branches.total)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Net Income</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.financial.netIncome)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Income</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(analyticsData.financial.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Expenses</span>
                  <span className="text-lg font-semibold text-red-600">
                    {formatCurrency(analyticsData.financial.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-sm font-medium text-gray-900">Net Income</span>
                  <span className={`text-lg font-bold ${analyticsData.financial.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(analyticsData.financial.netIncome)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Student Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Students</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatNumber(analyticsData.students.active)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Graduated Students</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatNumber(analyticsData.students.graduated)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-sm font-medium text-gray-900">Total Students</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatNumber(analyticsData.students.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Students by Gender</h3>
              <div className="space-y-3">
                {analyticsData.students.byGender.map((item) => (
                  <div key={item._id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item._id}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(item.count / analyticsData.students.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Staff by Type</h3>
              <div className="space-y-3">
                {analyticsData.staff.byType.map((item) => (
                  <div key={item._id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item._id}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(item.count / analyticsData.staff.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Branch Distribution */}
          {user?.type === 'SuperAdmin' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Branch Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.branches.studentDistribution.map((branch) => (
                  <div key={branch._id} className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">{branch.name}</h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-medium">{branch.count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Staff:</span>
                        <span className="font-medium">
                          {analyticsData.branches.staffDistribution.find(s => s._id === branch._id)?.count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
