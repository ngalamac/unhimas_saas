import React, { useState, useEffect } from 'react';
import { 
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Eye,
  CreditCard,
  Download,
  Users,
  TrendingUp,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useUI } from '../../context/UIContext';
import { formatXAF } from '../../utils/currency';
import { 
  getStudentsTuitionRecords, 
  recordTuitionPayment, 
  sendTuitionReminders,
  getTuitionAnalytics,
  exportTuitionReport 
} from '../../api/tuitionManagement';
import { StudentTuitionRecord } from '../../types/tuition';

const StudentTuitionDashboard: React.FC = () => {
  const { user } = useAuth(); // retained if future role-based filtering needed
  const { currentBranch } = useBranch();
  const { showToast } = useUI();
  
  // NOTE: Backend currently returns a simplified record list (see /api/tuition-management/students/records)
  // which doesn't match StudentTuitionRecord interface. We'll keep local shape flexible via 'any'
  // and derive a normalized record object for rendering to avoid runtime errors.
  const [records, setRecords] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    program: '',
    department: '',
    level: '',
    status: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    installmentKey: '',
    amount: '',
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchRecords();
    fetchAnalytics();
  }, [filters, page, currentBranch]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params: any = {
        ...filters,
        page,
        limit: 20,
        branch: currentBranch ? (currentBranch as any)._id : undefined
      };
      if (params.level === '') delete params.level; else params.level = Number(params.level);

  const response = await getStudentsTuitionRecords(params);
  const raw = Array.isArray(response.data) ? response.data : [];
  setRecords(raw);
  setTotal(response.meta?.total || raw.length || 0);
    } catch (error: any) {
      showToast(error.message || 'Failed to load tuition records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params: any = {
        ...filters,
        branch: currentBranch ? (currentBranch as any)._id : undefined
      };
      if (params.level === '') delete params.level; else params.level = Number(params.level);

      const response = await getTuitionAnalytics(params);
      // Backend analytics placeholder returns: { totals: { totalDue, totalPaid, balance }, status: {...}, count }
      const a = response?.data || {};
      const totals = a.totals || {};
      const status = a.status || {};
      const collectionRate = (totals.totalDue && totals.totalDue > 0)
        ? Math.round((totals.totalPaid / totals.totalDue) * 100)
        : 0;
      setAnalytics({
        totalCollected: totals.totalPaid || 0,
        totalOutstanding: totals.balance || 0,
        overdueCount: status.Overdue || 0,
        totalStudents: a.count || 0,
        collectionRate
      });
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedRecord || !paymentForm.installmentKey || !paymentForm.amount) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
  const studentId = selectedRecord?.student?._id || selectedRecord?.studentId || selectedRecord?.student?.studentId;
      if (!studentId) throw new Error('Missing student id');
      await recordTuitionPayment({
        studentId,
        installmentKey: paymentForm.installmentKey,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes
      });

      setShowPaymentModal(false);
      setSelectedRecord(null);
      setPaymentForm({
        installmentKey: '',
        amount: '',
        paymentMethod: 'cash',
        reference: '',
        notes: ''
      });
      fetchRecords();
      fetchAnalytics();
      showToast('Payment recorded successfully and synced with OHADA', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to record payment', 'error');
    }
  };

  const handleSendReminders = async (studentId?: string) => {
    try {
      const response = await sendTuitionReminders({
        studentId,
        reminderType: 'overdue'
      });

      showToast(`${response.data.sent} reminders sent successfully`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to send reminders', 'error');
    }
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv', reportType: string) => {
    try {
      const blob = await exportTuitionReport({
        format,
        reportType: reportType as any,
        filters: {
          ...filters,
          branch: currentBranch ? (currentBranch as any)._id : undefined
        }
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tuition-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Report exported successfully`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export report', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Partial': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Pending': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openPaymentModal = (record: any) => {
    setSelectedRecord(record);
    // Normalized installment list (support both installmentStatus and simplified installments)
    const instList = Array.isArray(record.installmentStatus)
      ? record.installmentStatus
      : Array.isArray(record.installments)
        ? record.installments.map((i: any) => ({
            installmentKey: i.key,
            label: i.label,
            remainingAmount: Math.max(0, (i.amountDue || i.amount || 0) - (i.paid || 0)),
            status: i.status || 'Pending'
          }))
        : [];
    const nextInstallment = instList.find((inst: any) => ['Pending','Partial','Overdue'].includes(inst.status));
    if (nextInstallment) {
      setPaymentForm(prev => ({
        ...prev,
        installmentKey: nextInstallment.installmentKey,
        amount: String(nextInstallment.remainingAmount || '')
      }));
    } else {
      setPaymentForm(prev => ({ ...prev, installmentKey: '', amount: '' }));
    }
    
    setShowPaymentModal(true);
  };

  const openHistoryModal = (record: any) => {
    setSelectedRecord(record);
    setShowHistoryModal(true);
  };

  if (loading && records.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-900">Student Tuition Management</h2>
          <p className="text-gray-600 mt-1">Track tuition payments with OHADA integration</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSendReminders()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <Mail className="w-4 h-4" />
            <span>Send Reminders</span>
          </button>
          <button
            onClick={() => handleExport('excel', 'collection_summary')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="text-xl font-bold text-gray-900">{formatXAF(analytics.totalCollected || 0)}</p>
                <p className="text-xs text-green-600">This academic year</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Outstanding Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatXAF(analytics.totalOutstanding || 0)}</p>
                <p className="text-xs text-red-600">{analytics.overdueCount || 0} overdue</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Students Tracked</p>
                <p className="text-xl font-bold text-gray-900">{analytics.totalStudents || 0}</p>
                <p className="text-xs text-blue-600">Active records</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-xl font-bold text-gray-900">{analytics.collectionRate || 0}%</p>
                <p className="text-xs text-purple-600">Target: 95%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search students..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partial">Partially Paid</option>
              <option value="Pending">Pending Payment</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <select
              value={filters.program}
              onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              {/* This would be populated from programs API */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ program: '', department: '', level: '', status: '', search: '' })}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students Tuition Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Student Tuition Records ({total})</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('excel', 'payment_history')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Export History
              </button>
              <button
                onClick={() => handleExport('pdf', 'outstanding_fees')}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Outstanding Report
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program & Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record: any) => {
                // Normalize fields based on backend simplified shape
                const installmentsNorm = Array.isArray(record.installmentStatus)
                  ? record.installmentStatus
                  : Array.isArray(record.installments)
                    ? record.installments.map((i: any) => ({
                        installmentKey: i.key,
                        label: i.label,
                        dueDate: i.dueDate,
                        remainingAmount: Math.max(0, (i.amountDue || i.amount || 0) - (i.paid || 0)),
                        status: i.status || 'Pending'
                      }))
                    : [];
                const nextDue = installmentsNorm.find((inst: any) => ['Pending','Partial','Overdue'].includes(inst.status));
                const totalDue = record.totalTargetAmount != null
                  ? record.totalTargetAmount
                  : (record.totalDue != null ? record.totalDue : installmentsNorm.reduce((s: number, it: any) => s + (it.targetAmount || it.amountDue || it.amount || 0), 0));
                const totalPaid = record.totalPaidAmount != null
                  ? record.totalPaidAmount
                  : (record.totalPaid != null ? record.totalPaid : installmentsNorm.reduce((s: number, it: any) => s + (it.paidAmount || it.paid || 0), 0));
                const totalRemaining = record.totalRemainingAmount != null
                  ? record.totalRemainingAmount
                  : (record.balanceDue != null ? record.balanceDue : Math.max(0, totalDue - totalPaid));
                const progressPercentage = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
                const overallStatus = record.overallStatus || record.tuitionStatus || (function(){
                  if (totalRemaining <= 0) return 'Paid';
                  if (installmentsNorm.some((i: any) => i.status === 'Overdue')) return 'Overdue';
                  if (totalPaid > 0) return 'Partial';
                  return 'Pending';
                })();

                return (
                  <tr key={record._id || record.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {(record.student?.names || record.names || '').split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0,3)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.student?.names || record.names}</div>
                          <div className="text-sm text-gray-500">ID: {record.student?.studentId || record.studentCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.tuitionStructure?.program?.name || record.program?.name || '—'}</div>
                      <div className="text-sm text-gray-500">
                        {(record.tuitionStructure?.department?.name || record.department?.name || '—')} {record.tuitionStructure?.level || record.level ? `- Level ${record.tuitionStructure?.level || record.level}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div 
                          className={`h-2 rounded-full ${
                            progressPercentage === 100 ? 'bg-green-500' :
                            progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {installmentsNorm.filter((i: any) => i.status === 'Paid').length} of {installmentsNorm.length} paid
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {nextDue ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{nextDue.label}</div>
                          <div className="text-sm text-gray-500">
                            Due: {nextDue.dueDate ? new Date(nextDue.dueDate).toLocaleDateString() : '—'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatXAF(nextDue.remainingAmount || 0)} remaining
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600">All paid</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatXAF(totalPaid)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {formatXAF(totalRemaining)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(overallStatus)}`}>
                        {getStatusIcon(overallStatus)}
                        <span className="ml-1">{overallStatus}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openHistoryModal(record)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Payment History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPaymentModal(record)}
                          className="text-green-600 hover:text-green-900"
                          title="Record Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendReminders(record.student._id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Send Reminder"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} records
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 20 >= total}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
  {showPaymentModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Record Tuition Payment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Student: {selectedRecord?.student?.names || selectedRecord?.names} ({selectedRecord?.student?.studentId || selectedRecord?.studentCode})
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Installment *</label>
                  <select
                    value={paymentForm.installmentKey}
                    onChange={(e) => {
                      const installment = selectedRecord.installmentStatus.find(i => i.installmentKey === e.target.value);
                      setPaymentForm(prev => ({
                        ...prev,
                        installmentKey: e.target.value,
                        amount: installment ? installment.remainingAmount.toString() : ''
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Installment</option>
                    {(Array.isArray(selectedRecord.installmentStatus) ? selectedRecord.installmentStatus : (selectedRecord.installments || []).map((i: any) => ({
                      installmentKey: i.key,
                      label: i.label,
                      remainingAmount: Math.max(0, (i.amountDue || i.amount || 0) - (i.paid || 0)),
                      status: i.status || 'Pending'
                    })))
                      .filter((inst: any) => inst.status !== 'Paid')
                      .map((installment: any) => (
                        <option key={installment.installmentKey} value={installment.installmentKey}>
                          {installment.label} - {formatXAF(installment.remainingAmount)} remaining
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (XAF) *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="check">Check</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional reference"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional payment notes"
                />
              </div>

              {/* OHADA Integration Info */}
              {paymentForm.installmentKey && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">OHADA Integration</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    This payment will automatically create a journal entry crediting account: 
            { (Array.isArray(selectedRecord.installmentStatus) ? selectedRecord.installmentStatus : [])
              .find((i: any) => i.installmentKey === paymentForm.installmentKey)?.ohadaAccountCode || '—'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedRecord.student.names} ({selectedRecord.student.studentId})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedRecord(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Total Paid</div>
                  <div className="text-xl font-bold text-green-700">{formatXAF(selectedRecord.totalPaidAmount)}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm text-red-600 font-medium">Remaining</div>
                  <div className="text-xl font-bold text-red-700">{formatXAF(selectedRecord.totalRemainingAmount)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Total Target</div>
                  <div className="text-xl font-bold text-blue-700">{formatXAF(selectedRecord.totalTargetAmount)}</div>
                </div>
              </div>

              {/* Installment Status */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Installment Status</h4>
                <div className="space-y-2">
                  {selectedRecord.installmentStatus.map((installment) => (
                    <div key={installment.installmentKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(installment.status)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{installment.label}</div>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(installment.dueDate).toLocaleDateString()} | 
                            OHADA: {installment.ohadaAccountCode}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatXAF(installment.paidAmount)} / {formatXAF(installment.targetAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {installment.lastPaymentDate && `Last: ${new Date(installment.lastPaymentDate).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Payment History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Installment</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">OHADA Entry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedRecord.paymentHistory.map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {selectedRecord.installmentStatus.find(i => i.installmentKey === payment.installmentKey)?.label}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {formatXAF(payment.amount)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {payment.reference || '—'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {payment.registeredBy.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-blue-600">
                            <button className="hover:underline">
                              View Entry
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedRecord.paymentHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>No payment history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTuitionDashboard;