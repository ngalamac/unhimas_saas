import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Plus,
  Eye,
  CheckCircle,
  AlertTriangle,
  Play,
  Download
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import { useNavigation } from '../../../context/NavigationContext';
import { formatXAF } from '../../../utils/currency';
import { 
  getPayrollPeriods, 
  createPayrollPeriod, 
  processPayroll, 
  getPayrollSummary,
  getTeachingSessions 
} from '../../../api/payroll';
import { PayrollPeriod, PayrollSummary, TeachingSession } from '../../../types/payroll';

const PayrollDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { showToast } = useUI();
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [recentSessions, setRecentSessions] = useState<TeachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchData();
  }, [currentBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch payroll periods
      const periodsRes = await getPayrollPeriods();
      setPeriods(periodsRes.data);
      
      // Get current/latest period
      const latest = periodsRes.data[0];
      if (latest) {
        setCurrentPeriod(latest);
        
        // Fetch summary for current period
        const summaryRes = await getPayrollSummary(latest._id);
        setSummary(summaryRes.data);
      }
      
      // Fetch recent teaching sessions
      const sessionsRes = await getTeachingSessions({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      setRecentSessions(sessionsRes.data.slice(0, 10));
      
    } catch (error: any) {
      showToast(error.message || 'Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async () => {
    try {
      await createPayrollPeriod({
        month: newPeriod.month,
        year: newPeriod.year,
        branch: currentBranch ? (currentBranch as any)._id : undefined
      });
      
      setShowCreateModal(false);
      fetchData();
      showToast('Payroll period created successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create payroll period', 'error');
    }
  };

  const handleProcessPayroll = async (periodId: string) => {
    if (!confirm('Are you sure you want to process payroll for this period? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(true);
      await processPayroll(periodId);
      fetchData();
      showToast('Payroll processed successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to process payroll', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'processing': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
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
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">Manage staff salaries and teaching hours</p>
          {currentBranch && (
            <p className="text-sm text-blue-600 mt-1">Branch: {(currentBranch as any).name}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setCurrentPage('staff-management');
              setBreadcrumb(['Human Resources', 'Staff Directory']);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Manage Staff</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Period</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Gross Salary</p>
                <p className="text-2xl font-bold">{formatXAF(summary.totalGrossSalary)}</p>
                <p className="text-green-100 text-xs mt-1">Before deductions</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Net Salary</p>
                <p className="text-2xl font-bold">{formatXAF(summary.totalNetSalary)}</p>
                <p className="text-blue-100 text-xs mt-1">After deductions</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Staff Count</p>
                <p className="text-2xl font-bold">{summary.totalStaff}</p>
                <p className="text-purple-100 text-xs mt-1">Active employees</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Average Salary</p>
                <p className="text-2xl font-bold">{formatXAF(summary.averageSalary)}</p>
                <p className="text-orange-100 text-xs mt-1">Per employee</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Periods */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Payroll Periods</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Create New Period
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periods.map((period) => (
                <tr key={period._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getMonthName(period.month)} {period.year}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(period.startDate)} - {formatDate(period.endDate)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                      {getStatusIcon(period.status)}
                      <span className="ml-1 capitalize">{period.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {period.staffCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatXAF(period.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(period.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setCurrentPage('payroll-details');
                          setBreadcrumb(['Human Resources', 'Payroll', `${getMonthName(period.month)} ${period.year}`]);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {period.status === 'draft' && (
                        <button
                          onClick={() => handleProcessPayroll(period._id)}
                          disabled={processing}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Process Payroll"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {period.status === 'completed' && (
                        <button
                          className="text-purple-600 hover:text-purple-900"
                          title="Export Payroll"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {periods.length === 0 && (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No payroll periods</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first payroll period to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Payroll Period
            </button>
          </div>
        )}
      </div>

      {/* Recent Teaching Sessions */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Teaching Sessions</h3>
            <button
              onClick={() => {
                setCurrentPage('teaching-sessions');
                setBreadcrumb(['Human Resources', 'Teaching Sessions']);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lecturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSessions.map((session) => (
                <tr key={session._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {typeof session.lecturer === 'string' ? session.lecturer : session.lecturer.names}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {session.course.code} - {session.course.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(session.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.startTime} - {session.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{session.hoursWorked}h</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.status === 'approved' ? 'bg-green-100 text-green-800' :
                      session.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status === 'approved' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : session.status === 'rejected' ? (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {recentSessions.length === 0 && (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No teaching sessions</h3>
            <p className="text-sm text-gray-500">No teaching sessions recorded for this month.</p>
          </div>
        )}
      </div>

      {/* Create Period Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Payroll Period</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={newPeriod.month}
                  onChange={(e) => setNewPeriod(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={newPeriod.year}
                  onChange={(e) => setNewPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePeriod}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Period
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDashboard;