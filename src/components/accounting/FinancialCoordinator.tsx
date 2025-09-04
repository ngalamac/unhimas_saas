import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { formatXAF } from '../../utils/currency';

interface CoordinationData {
  studentFinancials: {
    totalOwed: number;
    totalPaid: number;
    pendingCount: number;
    overdueCount: number;
    recentPayments: Array<{
      studentName: string;
      amount: number;
      date: string;
      status: string;
    }>;
  };
  staffFinancials: {
    monthlyPayroll: number;
    pendingPayroll: number;
    staffCount: number;
    lastPayrollDate: string;
  };
  branchFinancials: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    monthlyGrowth: number;
  };
  alerts: Array<{
    id: string;
    type: 'urgent' | 'warning' | 'info';
    title: string;
    description: string;
    action: string;
    targetPage: string;
  }>;
}

const FinancialCoordinator: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const [data, setData] = useState<CoordinationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoordinationData();
  }, [currentBranch]);

  const fetchCoordinationData = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive coordination data
      const mockData: CoordinationData = {
        studentFinancials: {
          totalOwed: 45000000,
          totalPaid: 125000000,
          pendingCount: 156,
          overdueCount: 23,
          recentPayments: [
            { studentName: 'Alain Kamga', amount: 525000, date: '2024-12-15', status: 'completed' },
            { studentName: 'Grace Mballa', amount: 300000, date: '2024-12-14', status: 'completed' },
            { studentName: 'Emmanuel Biya', amount: 200000, date: '2024-12-13', status: 'pending' }
          ]
        },
        staffFinancials: {
          monthlyPayroll: 35000000,
          pendingPayroll: 8500000,
          staffCount: 89,
          lastPayrollDate: '2024-11-30'
        },
        branchFinancials: {
          totalRevenue: 125000000,
          totalExpenses: 45000000,
          netIncome: 80000000,
          monthlyGrowth: 12.5
        },
        alerts: [
          {
            id: '1',
            type: 'urgent',
            title: 'Overdue Student Payments',
            description: '23 students have overdue payments totaling 5.2M XAF',
            action: 'Review Payments',
            targetPage: 'tuition-management'
          },
          {
            id: '2',
            type: 'warning',
            title: 'Payroll Due Soon',
            description: 'Monthly staff payroll of 35M XAF is due in 3 days',
            action: 'Process Payroll',
            targetPage: 'payroll'
          },
          {
            id: '3',
            type: 'info',
            title: 'Monthly Report Ready',
            description: 'December financial report is ready for review',
            action: 'View Report',
            targetPage: 'reports'
          }
        ]
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch coordination data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (page: string, breadcrumb: string[]) => {
    setCurrentPage(page);
    setBreadcrumb(breadcrumb);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
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
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Financial & Access Coordination</h2>
        <p className="text-gray-600 mt-2">Integrated management of roles, permissions, and financial operations</p>
      </div>

      {data && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Student Payments</p>
                  <p className="text-2xl font-bold">{formatXAF(data.studentFinancials.totalPaid)}</p>
                  <p className="text-green-100 text-xs mt-1">Collected this period</p>
                </div>
                <ArrowUpRight className="w-8 h-8 bg-white bg-opacity-20 p-2 rounded-lg" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Outstanding Debt</p>
                  <p className="text-2xl font-bold">{formatXAF(data.studentFinancials.totalOwed)}</p>
                  <p className="text-red-100 text-xs mt-1">{data.studentFinancials.pendingCount} students</p>
                </div>
                <ArrowDownRight className="w-8 h-8 bg-white bg-opacity-20 p-2 rounded-lg" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Staff Payroll</p>
                  <p className="text-2xl font-bold">{formatXAF(data.staffFinancials.monthlyPayroll)}</p>
                  <p className="text-blue-100 text-xs mt-1">{data.staffFinancials.staffCount} staff members</p>
                </div>
                <Users className="w-8 h-8 bg-white bg-opacity-20 p-2 rounded-lg" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Net Income</p>
                  <p className="text-2xl font-bold">{formatXAF(data.branchFinancials.netIncome)}</p>
                  <p className="text-purple-100 text-xs mt-1">+{data.branchFinancials.monthlyGrowth}% growth</p>
                </div>
                <TrendingUp className="w-8 h-8 bg-white bg-opacity-20 p-2 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Alerts and Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Alerts */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Priority Alerts</h3>
              </div>
              <div className="p-6 space-y-4">
                {data.alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <button
                          onClick={() => handleNavigation(alert.targetPage, ['Coordination', alert.action])}
                          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {alert.action} →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Access */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Access</h3>
              </div>
              <div className="p-6 space-y-3">
                {filteredLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleNavigation(link)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${link.color}`}>
                        {link.icon}
                      </div>
                      <span className="font-medium text-gray-900">{link.title}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialCoordinator;