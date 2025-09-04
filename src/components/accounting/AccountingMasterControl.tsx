import React, { useState, useEffect } from 'react';
import { 
  Command, 
  Search, 
  DollarSign, 
  Users, 
  Building2, 
  FileText, 
  BarChart3,
  Settings,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Eye,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useUI } from '../../context/UIContext';

interface MasterControlData {
  systemOverview: {
    totalUsers: number;
    activeUsers: number;
    totalBranches: number;
    activeBranches: number;
    totalStudents: number;
    totalStaff: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  };
  financialOverview: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    pendingTransactions: number;
    monthlyGrowth: number;
  };
  accessControl: {
    totalRoles: number;
    activePermissions: number;
    recentChanges: number;
    securityScore: number;
  };
  quickCommands: Array<{
    id: string;
    command: string;
    description: string;
    icon: React.ReactNode;
    page: string;
    breadcrumb: string[];
    category: 'financial' | 'users' | 'system' | 'reports';
  }>;
}

const AccountingMasterControl: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { showToast } = useUI();
  const [data, setData] = useState<MasterControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commandSearch, setCommandSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchMasterControlData();
  }, [currentBranch]);

  const fetchMasterControlData = async () => {
    try {
      setLoading(true);
      
      const mockData: MasterControlData = {
        systemOverview: {
          totalUsers: 89,
          activeUsers: 76,
          totalBranches: 4,
          activeBranches: 3,
          totalStudents: 1247,
          totalStaff: 89,
          systemHealth: 'excellent'
        },
        financialOverview: {
          totalRevenue: 125000000,
          totalExpenses: 45000000,
          netIncome: 80000000,
          pendingTransactions: 8,
          monthlyGrowth: 12.5
        },
        accessControl: {
          totalRoles: 6,
          activePermissions: 156,
          recentChanges: 12,
          securityScore: 94
        },
        quickCommands: [
          {
            id: 'add-transaction',
            command: 'Add Transaction',
            description: 'Record new income or expense',
            icon: <Plus className="w-4 h-4" />,
            page: 'transactions',
            breadcrumb: ['Accounting', 'Transactions'],
            category: 'financial'
          },
          {
            id: 'student-payment',
            command: 'Process Student Payment',
            description: 'Record tuition payment',
            icon: <Users className="w-4 h-4" />,
            page: 'tuition-management',
            breadcrumb: ['Students', 'Tuition Management'],
            category: 'financial'
          },
          {
            id: 'create-user',
            command: 'Create User',
            description: 'Add new system user',
            icon: <Users className="w-4 h-4" />,
            page: 'user-management',
            breadcrumb: ['Roles & Access', 'User Management'],
            category: 'users'
          },
          {
            id: 'manage-roles',
            command: 'Manage Roles',
            description: 'Configure user permissions',
            icon: <Shield className="w-4 h-4" />,
            page: 'enhanced-roles',
            breadcrumb: ['Roles & Access', 'Enhanced Management'],
            category: 'users'
          },
          {
            id: 'financial-report',
            command: 'Generate Report',
            description: 'Create financial report',
            icon: <FileText className="w-4 h-4" />,
            page: 'reports',
            breadcrumb: ['Accounting', 'Reports'],
            category: 'reports'
          },
          {
            id: 'budget-analysis',
            command: 'Budget Analysis',
            description: 'Analyze spending patterns',
            icon: <BarChart3 className="w-4 h-4" />,
            page: 'budget-analysis',
            breadcrumb: ['Accounting', 'Budget Analysis'],
            category: 'reports'
          },
          {
            id: 'system-settings',
            command: 'System Settings',
            description: 'Configure system parameters',
            icon: <Settings className="w-4 h-4" />,
            page: 'settings',
            breadcrumb: ['Settings'],
            category: 'system'
          },
          {
            id: 'branch-overview',
            command: 'Branch Overview',
            description: 'View all branches',
            icon: <Building2 className="w-4 h-4" />,
            page: 'view-branches',
            breadcrumb: ['Branches', 'View Branches'],
            category: 'system'
          }
        ]
      };

      setData(mockData);
    } catch (error) {
      showToast('Failed to load master control data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = (command: MasterControlData['quickCommands'][0]) => {
    setCurrentPage(command.page);
    setBreadcrumb(command.breadcrumb);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredCommands = data?.quickCommands.filter(command => {
    const matchesSearch = command.command.toLowerCase().includes(commandSearch.toLowerCase()) ||
                         command.description.toLowerCase().includes(commandSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || command.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

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
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Command className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Master Control Center</h2>
        <p className="text-gray-600 mt-2">Unified command center for accounting, roles, and system management</p>
      </div>

      {data && (
        <>
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">System Users</p>
                  <p className="text-xl font-bold text-gray-900">{data.systemOverview.totalUsers}</p>
                  <p className="text-xs text-green-600">{data.systemOverview.activeUsers} active</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Branches</p>
                  <p className="text-xl font-bold text-gray-900">{data.systemOverview.totalBranches}</p>
                  <p className="text-xs text-green-600">{data.systemOverview.activeBranches} operational</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Security Score</p>
                  <p className="text-xl font-bold text-gray-900">{data.accessControl.securityScore}%</p>
                  <p className="text-xs text-green-600">Excellent</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">System Health</p>
                  <p className={`text-xl font-bold ${getHealthColor(data.systemOverview.systemHealth)}`}>
                    {data.systemOverview.systemHealth}
                  </p>
                  <p className="text-xs text-gray-500">All systems operational</p>
                </div>
              </div>
            </div>
          </div>

          {/* Command Center */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Quick Commands</h3>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="financial">Financial</option>
                    <option value="users">Users & Access</option>
                    <option value="reports">Reports</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    placeholder="Search commands..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredCommands.map((command) => (
                  <button
                    key={command.id}
                    onClick={() => handleCommand(command)}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left group border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                        {command.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {command.command}
                        </p>
                        <p className="text-xs text-gray-600">{command.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
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

export default AccountingMasterControl;