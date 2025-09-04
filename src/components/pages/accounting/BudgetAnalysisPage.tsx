import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  DollarSign,
  PieChart,
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';
import { formatXAF } from '../../../utils/currency';

interface BudgetData {
  categories: Array<{
    name: string;
    type: 'income' | 'expense';
    budgeted: number;
    actual: number;
    variance: number;
    percentage: number;
  }>;
  summary: {
    totalBudgeted: number;
    totalActual: number;
    totalVariance: number;
    onTrack: number;
    overBudget: number;
    underBudget: number;
  };
  monthlyTrends: Array<{
    month: string;
    budgeted: number;
    actual: number;
  }>;
}

const BudgetAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch, managedBranches } = useBranch();
  const { showToast } = useUI();
  
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [viewType, setViewType] = useState<'overview' | 'categories' | 'trends'>('overview');
  
  const isSuperAdmin = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      if (selectedBranch) params.append('branch', selectedBranch);
      if (!isSuperAdmin && currentBranch) {
        params.append('branch', (currentBranch as any)._id);
      }

      // Mock budget data for demonstration
      const mockBudgetData: BudgetData = {
        categories: [
          { name: 'Tuition Fees', type: 'income', budgeted: 50000000, actual: 45000000, variance: -5000000, percentage: 90 },
          { name: 'Registration fees', type: 'income', budgeted: 8000000, actual: 8500000, variance: 500000, percentage: 106.25 },
          { name: 'Payroll Expenses', type: 'expense', budgeted: 25000000, actual: 26000000, variance: 1000000, percentage: 104 },
          { name: 'Utilities', type: 'expense', budgeted: 3000000, actual: 2800000, variance: -200000, percentage: 93.33 },
          { name: 'Teaching materials', type: 'expense', budgeted: 2000000, actual: 2200000, variance: 200000, percentage: 110 },
        ],
        summary: {
          totalBudgeted: 88000000,
          totalActual: 84500000,
          totalVariance: -3500000,
          onTrack: 2,
          overBudget: 2,
          underBudget: 1
        },
        monthlyTrends: [
          { month: 'Jan', budgeted: 7500000, actual: 7200000 },
          { month: 'Feb', budgeted: 7500000, actual: 7800000 },
          { month: 'Mar', budgeted: 7500000, actual: 7400000 },
          { month: 'Apr', budgeted: 7500000, actual: 7900000 },
          { month: 'May', budgeted: 7500000, actual: 7600000 },
          { month: 'Jun', budgeted: 7500000, actual: 8100000 },
        ]
      };

      setBudgetData(mockBudgetData);
    } catch (err: any) {
      setError(err.message || 'Failed to load budget data');
      showToast('Failed to load budget data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [dateRange, selectedBranch, currentBranch]);

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600 bg-red-100';
    if (variance < 0) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Analysis</h1>
          <p className="text-gray-600 mt-1">Track budget performance and variance analysis</p>
          {currentBranch && !isSuperAdmin && (
            <p className="text-sm text-blue-600 mt-1">Branch: {(currentBranch as any).name}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="text-sm border-none focus:outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="text-sm border-none focus:outline-none"
            />
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Branch Filter for SuperAdmin */}
      {isSuperAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {managedBranches.map((branch: any) => (
                <option key={branch._id || branch.id} value={branch._id || branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* View Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'categories', name: 'Categories', icon: <Target className="w-4 h-4" /> },
              { id: 'trends', name: 'Trends', icon: <TrendingUp className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewType(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  viewType === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {budgetData && (
            <>
              {viewType === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Target className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Budgeted</p>
                          <p className="text-xl font-bold text-blue-700">
                            {formatXAF(budgetData.summary.totalBudgeted)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Actual Spent</p>
                          <p className="text-xl font-bold text-purple-700">
                            {formatXAF(budgetData.summary.totalActual)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-lg border ${
                      budgetData.summary.totalVariance >= 0 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {budgetData.summary.totalVariance >= 0 ? (
                          <TrendingUp className="w-8 h-8 text-red-600" />
                        ) : (
                          <TrendingDown className="w-8 h-8 text-green-600" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${
                            budgetData.summary.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            Variance
                          </p>
                          <p className={`text-xl font-bold ${
                            budgetData.summary.totalVariance >= 0 ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {formatXAF(Math.abs(budgetData.summary.totalVariance))}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">On Track:</span>
                          <span className="text-sm font-medium text-green-600">{budgetData.summary.onTrack}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Over Budget:</span>
                          <span className="text-sm font-medium text-red-600">{budgetData.summary.overBudget}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Under Budget:</span>
                          <span className="text-sm font-medium text-blue-600">{budgetData.summary.underBudget}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget Performance Chart */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actual Performance</h3>
                    <div className="h-64">
                      <svg className="w-full h-full" viewBox="0 0 600 200">
                        <defs>
                          <pattern id="grid" width="60" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {/* Budgeted bars (blue) */}
                        <rect x="50" y="40" width="25" height="120" fill="#3b82f6" opacity="0.7"/>
                        <rect x="130" y="60" width="25" height="100" fill="#3b82f6" opacity="0.7"/>
                        <rect x="210" y="50" width="25" height="110" fill="#3b82f6" opacity="0.7"/>
                        <rect x="290" y="70" width="25" height="90" fill="#3b82f6" opacity="0.7"/>
                        <rect x="370" y="80" width="25" height="80" fill="#3b82f6" opacity="0.7"/>
                        
                        {/* Actual bars (green/red) */}
                        <rect x="80" y="50" width="25" height="110" fill="#10b981" opacity="0.8"/>
                        <rect x="160" y="55" width="25" height="105" fill="#ef4444" opacity="0.8"/>
                        <rect x="240" y="45" width="25" height="115" fill="#10b981" opacity="0.8"/>
                        <rect x="320" y="75" width="25" height="85" fill="#ef4444" opacity="0.8"/>
                        <rect x="400" y="85" width="25" height="75" fill="#10b981" opacity="0.8"/>
                        
                        {/* Labels */}
                        <text x="62" y="190" className="text-xs fill-gray-500">Tuition</text>
                        <text x="142" y="190" className="text-xs fill-gray-500">Registration</text>
                        <text x="222" y="190" className="text-xs fill-gray-500">Payroll</text>
                        <text x="302" y="190" className="text-xs fill-gray-500">Utilities</text>
                        <text x="382" y="190" className="text-xs fill-gray-500">Materials</text>
                      </svg>
                    </div>
                    <div className="flex items-center justify-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full opacity-70"></div>
                        <span className="text-sm text-gray-600">Budgeted</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Actual (Under)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Actual (Over)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewType === 'categories' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Category Budget Analysis</h3>
                  <div className="space-y-3">
                    {budgetData.categories.map((category, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              category.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {category.type === 'income' ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            Math.abs(category.variance) / category.budgeted <= 0.05 
                              ? 'bg-green-100 text-green-800'
                              : category.variance > 0 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {getVarianceIcon(category.variance)}
                            <span className="ml-1">
                              {Math.abs(category.variance) / category.budgeted <= 0.05 
                                ? 'On Track'
                                : category.variance > 0 
                                  ? 'Over Budget'
                                  : 'Under Budget'}
                            </span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Budgeted</p>
                            <p className="font-semibold text-gray-900">{formatXAF(category.budgeted)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Actual</p>
                            <p className="font-semibold text-gray-900">{formatXAF(category.actual)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Variance</p>
                            <p className={`font-semibold ${
                              category.variance >= 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {category.variance >= 0 ? '+' : ''}{formatXAF(category.variance)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{category.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                category.percentage > 100 ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(category.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewType === 'trends' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Budget Trends</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="h-64">
                      <svg className="w-full h-full" viewBox="0 0 600 200">
                        <defs>
                          <pattern id="trendGrid" width="100" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 100 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#trendGrid)" />
                        
                        {/* Budgeted line */}
                        <path
                          d="M 50 100 L 150 100 L 250 100 L 350 100 L 450 100 L 550 100"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeDasharray="5,5"
                        />
                        
                        {/* Actual line */}
                        <path
                          d="M 50 110 L 150 90 L 250 105 L 350 85 L 450 95 L 550 80"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                        />
                        
                        {/* Data points */}
                        {budgetData.monthlyTrends.map((_, index) => (
                          <g key={index}>
                            <circle cx={50 + index * 100} cy="100" r="4" fill="#3b82f6" />
                            <circle cx={50 + index * 100} cy={110 - index * 5} r="4" fill="#10b981" />
                          </g>
                        ))}
                        
                        {/* X-axis labels */}
                        {budgetData.monthlyTrends.map((trend, index) => (
                          <text key={index} x={50 + index * 100} y="190" className="text-xs fill-gray-500 text-anchor-middle">
                            {trend.month}
                          </text>
                        ))}
                      </svg>
                    </div>
                    <div className="flex items-center justify-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 border-2 border-blue-500 rounded-full bg-white"></div>
                        <span className="text-sm text-gray-600">Budgeted</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Actual</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalysisPage;