import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  DollarSign,
  FileText,
  Filter,
  Eye
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';
import { formatXAF } from '../../../utils/currency';
import BalanceSheet from '../../accounting/BalanceSheet';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch, managedBranches } = useBranch();
  const { showToast } = useUI();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState('income-statement');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);
  
  const isSuperAdmin = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;

  const reportTypes = [
    {
      id: 'income-statement',
      name: 'Income Statement',
      description: 'Revenue and income analysis',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'expense-statement',
      name: 'Expense Statement',
      description: 'Expense breakdown and analysis',
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'bg-red-100 text-red-600'
    },
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      description: 'Cash inflows and outflows',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'monthly-trends',
      name: 'Monthly Trends',
      description: 'Month-over-month analysis',
      icon: <PieChart className="w-5 h-5" />,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      if (selectedBranch) params.append('branch', selectedBranch);
      if (!isSuperAdmin && currentBranch) {
        params.append('branch', (currentBranch as any)._id);
      }

      let endpoint = '';
      switch (selectedReport) {
        case 'income-statement':
          endpoint = '/api/accounting/reports/income-statement';
          break;
        case 'expense-statement':
          endpoint = '/api/accounting/reports/expense-statement';
          break;
        case 'balance-sheet':
          endpoint = '/api/accounting/reports/balance-sheet';
          break;
        default:
          endpoint = '/api/accounting/summary';
      }

      const response = await fetchClient.get(`${endpoint}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch report data');
      
      const data = await response.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report data');
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, dateRange, selectedBranch, currentBranch]);

  const handleExportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      if (selectedBranch) params.append('branch', selectedBranch);
      if (!isSuperAdmin && currentBranch) {
        params.append('branch', (currentBranch as any)._id);
      }
      params.append('format', format);

      const response = await fetchClient.get(`/api/accounting/export?${params.toString()}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport}-${dateRange.from}-to-${dateRange.to}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Report exported as ${format.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    }
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Generate comprehensive financial reports and analytics</p>
          {currentBranch && !isSuperAdmin && (
            <p className="text-sm text-blue-600 mt-1">Branch: {(currentBranch as any).name}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExportReport('csv')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExportReport('excel')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExportReport('pdf')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Branches</option>
                {managedBranches.map((branch: any) => (
                  <option key={branch._id || branch.id} value={branch._id || branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedReport === report.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${report.color}`}>
                {report.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {reportTypes.find(r => r.id === selectedReport)?.name || 'Report'}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBalanceSheet(true)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Balance Sheet</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Error loading report</h3>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Income</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatXAF(reportData.summary?.totalIncome ?? reportData.totalIncome ?? reportData.total ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-700">
                        {formatXAF(reportData.summary?.totalExpenses ?? reportData.totalExpenses ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Net Income</p>
                      <p className={`text-2xl font-bold ${
                        (reportData.total || reportData.totalIncome || 0) - (reportData.totalExpenses || 0) >= 0
                          ? 'text-blue-700'
                          : 'text-red-700'
                      }`}>
                        {formatXAF((reportData.summary?.netIncome ?? ((reportData.summary?.totalIncome ?? reportData.totalIncome ?? reportData.total ?? 0) - (reportData.summary?.totalExpenses ?? reportData.totalExpenses ?? 0))))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Table */}
              {reportData.breakdown && reportData.breakdown.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transactions
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.breakdown.map((item: any, index: number) => {
                          // Defensive: render category/type as string, not object
                          let category = '';
                          if (typeof item.category === 'string') category = item.category;
                          else if (item._id && typeof item._id === 'object') {
                            category = [item._id.category, item._id.type].filter(Boolean).join(' - ');
                          } else if (typeof item._id === 'string') category = item._id;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {category}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatXAF(item.total || item.amount || 0)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.count || 0}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {((item.total || item.amount || 0) / (reportData.total || 1) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No data available</h3>
              <p className="text-sm text-gray-500">No data found for the selected period and filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Balance Sheet Modal */}
      {showBalanceSheet && (
        <BalanceSheet 
          onClose={() => setShowBalanceSheet(false)} 
          branch={selectedBranch || (currentBranch ? (currentBranch as any)._id : undefined)} 
        />
      )}
    </div>
  );
};

export default ReportsPage;