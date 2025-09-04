import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';
import { formatXAF } from '../../../utils/currency';

interface InsightData {
  kpis: {
    profitMargin: number;
    expenseRatio: number;
    growthRate: number;
    efficiency: number;
  };
  trends: {
    revenue: Array<{ period: string; value: number; change: number }>;
    expenses: Array<{ period: string; value: number; change: number }>;
    profit: Array<{ period: string; value: number; change: number }>;
  };
  insights: Array<{
    id: string;
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation?: string;
  }>;
  forecasts: {
    nextMonth: {
      expectedRevenue: number;
      expectedExpenses: number;
      confidence: number;
    };
    nextQuarter: {
      expectedRevenue: number;
      expectedExpenses: number;
      confidence: number;
    };
  };
}

const FinancialInsightsPage: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch, managedBranches } = useBranch();
  const { showToast } = useUI();
  
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  const isSuperAdmin = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;

  const fetchInsightData = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive insight data
      const mockInsightData: InsightData = {
        kpis: {
          profitMargin: 64.2,
          expenseRatio: 35.8,
          growthRate: 12.5,
          efficiency: 87.3
        },
        trends: {
          revenue: [
            { period: 'Jan', value: 45000000, change: 8.5 },
            { period: 'Feb', value: 48000000, change: 6.7 },
            { period: 'Mar', value: 52000000, change: 8.3 },
            { period: 'Apr', value: 49000000, change: -5.8 },
            { period: 'May', value: 55000000, change: 12.2 },
            { period: 'Jun', value: 58000000, change: 5.5 }
          ],
          expenses: [
            { period: 'Jan', value: 18000000, change: 5.2 },
            { period: 'Feb', value: 19000000, change: 5.6 },
            { period: 'Mar', value: 17500000, change: -7.9 },
            { period: 'Apr', value: 20000000, change: 14.3 },
            { period: 'May', value: 18500000, change: -7.5 },
            { period: 'Jun', value: 19500000, change: 5.4 }
          ],
          profit: [
            { period: 'Jan', value: 27000000, change: 10.8 },
            { period: 'Feb', value: 29000000, change: 7.4 },
            { period: 'Mar', value: 34500000, change: 19.0 },
            { period: 'Apr', value: 29000000, change: -15.9 },
            { period: 'May', value: 36500000, change: 25.9 },
            { period: 'Jun', value: 38500000, change: 5.5 }
          ]
        },
        insights: [
          {
            id: '1',
            type: 'positive',
            title: 'Strong Revenue Growth',
            description: 'Revenue has increased by 12.5% compared to the same period last year.',
            impact: 'high',
            recommendation: 'Continue current enrollment strategies and consider expanding successful programs.'
          },
          {
            id: '2',
            type: 'negative',
            title: 'Rising Utility Costs',
            description: 'Utility expenses have increased by 18% this quarter.',
            impact: 'medium',
            recommendation: 'Consider energy-saving initiatives and negotiate better utility rates.'
          },
          {
            id: '3',
            type: 'neutral',
            title: 'Stable Payroll Expenses',
            description: 'Staff costs remain consistent with budget projections.',
            impact: 'low',
            recommendation: 'Monitor for any upcoming salary adjustments or new hires.'
          },
          {
            id: '4',
            type: 'positive',
            title: 'Improved Collection Rate',
            description: 'Student fee collection rate has improved to 94.2%.',
            impact: 'high',
            recommendation: 'Implement similar collection strategies across all programs.'
          }
        ],
        forecasts: {
          nextMonth: {
            expectedRevenue: 62000000,
            expectedExpenses: 21000000,
            confidence: 85
          },
          nextQuarter: {
            expectedRevenue: 180000000,
            expectedExpenses: 65000000,
            confidence: 78
          }
        }
      };

      setInsightData(mockInsightData);
    } catch (err: any) {
      setError(err.message || 'Failed to load insight data');
      showToast('Failed to load financial insights', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightData();
  }, [dateRange, selectedBranch, currentBranch]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'negative': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'neutral': return <Target className="w-5 h-5 text-blue-600" />;
      default: return <Eye className="w-5 h-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-50 border-green-200';
      case 'negative': return 'bg-red-50 border-red-200';
      case 'neutral': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Financial Insights</h1>
          <p className="text-gray-600 mt-1">AI-powered financial analysis and recommendations</p>
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export Insights</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {insightData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Profit Margin</p>
                <p className="text-2xl font-bold">{insightData.kpis.profitMargin}%</p>
                <p className="text-green-100 text-xs mt-1">Excellent performance</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Expense Ratio</p>
                <p className="text-2xl font-bold">{insightData.kpis.expenseRatio}%</p>
                <p className="text-blue-100 text-xs mt-1">Well controlled</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <PieChart className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Growth Rate</p>
                <p className="text-2xl font-bold">+{insightData.kpis.growthRate}%</p>
                <p className="text-purple-100 text-xs mt-1">Year over year</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Efficiency Score</p>
                <p className="text-2xl font-bold">{insightData.kpis.efficiency}%</p>
                <p className="text-orange-100 text-xs mt-1">Above average</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Zap className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insightData && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insightData.insights.map((insight) => (
                <div key={insight.id} className={`p-6 rounded-lg border ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactBadge(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs font-medium text-gray-800 mb-1">Recommendation:</p>
                          <p className="text-xs text-gray-700">{insight.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Forecasts */}
      {insightData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Next Month Forecast</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  {formatXAF(insightData.forecasts.nextMonth.expectedRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Expenses</span>
                <span className="text-lg font-bold text-red-600">
                  {formatXAF(insightData.forecasts.nextMonth.expectedExpenses)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm font-medium text-gray-900">Projected Profit</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatXAF(insightData.forecasts.nextMonth.expectedRevenue - insightData.forecasts.nextMonth.expectedExpenses)}
                </span>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Confidence: {insightData.forecasts.nextMonth.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Next Quarter Forecast</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  {formatXAF(insightData.forecasts.nextQuarter.expectedRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Expenses</span>
                <span className="text-lg font-bold text-red-600">
                  {formatXAF(insightData.forecasts.nextQuarter.expectedExpenses)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm font-medium text-gray-900">Projected Profit</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatXAF(insightData.forecasts.nextQuarter.expectedRevenue - insightData.forecasts.nextQuarter.expectedExpenses)}
                </span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-800">
                    Confidence: {insightData.forecasts.nextQuarter.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Analysis */}
      {insightData && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Trend Analysis</h3>
          </div>
          <div className="p-6">
            <div className="h-64">
              <svg className="w-full h-full" viewBox="0 0 600 200">
                <defs>
                  <pattern id="insightGrid" width="100" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                  </pattern>
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#insightGrid)" />
                
                {/* Revenue area */}
                <path
                  d="M 50 120 L 150 110 L 250 90 L 350 100 L 450 80 L 550 70 L 550 180 L 50 180 Z"
                  fill="url(#revenueGradient)"
                />
                
                {/* Expense area */}
                <path
                  d="M 50 150 L 150 145 L 250 155 L 350 140 L 450 150 L 550 145 L 550 180 L 50 180 Z"
                  fill="url(#expenseGradient)"
                />
                
                {/* Revenue line */}
                <path
                  d="M 50 120 L 150 110 L 250 90 L 350 100 L 450 80 L 550 70"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
                
                {/* Expense line */}
                <path
                  d="M 50 150 L 150 145 L 250 155 L 350 140 L 450 150 L 550 145"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                />
                
                {/* Data points */}
                {insightData.trends.revenue.map((_, index) => (
                  <g key={index}>
                    <circle cx={50 + index * 100} cy={120 - index * 8} r="4" fill="#10b981" />
                    <circle cx={50 + index * 100} cy={150 - index * 2} r="4" fill="#ef4444" />
                  </g>
                ))}
                
                {/* X-axis labels */}
                {insightData.trends.revenue.map((trend, index) => (
                  <text key={index} x={50 + index * 100} y="190" className="text-xs fill-gray-500 text-anchor-middle">
                    {trend.period}
                  </text>
                ))}
              </svg>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Revenue Trend</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Expense Trend</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialInsightsPage;