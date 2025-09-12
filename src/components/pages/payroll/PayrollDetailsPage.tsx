import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  Download, 
  Eye,
  Edit,
  CreditCard,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import { formatXAF } from '../../../utils/currency';
import { 
  getPayrollEntries, 
  updatePayrollEntry, 
  approvePayrollEntry, 
  markPayrollEntryPaid,
  exportPayroll 
} from '../../../api/payroll';
import { PayrollEntry } from '../../../types/payroll';

const PayrollDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { showToast } = useUI();
  
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    if (selectedPeriod) {
      fetchPayrollEntries();
    }
  }, [selectedPeriod]);

  const fetchPayrollEntries = async () => {
    try {
      setLoading(true);
      const response = await getPayrollEntries(selectedPeriod);
      setEntries(response.data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load payroll entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEntry = async (entryId: string) => {
    try {
      await approvePayrollEntry(entryId);
      fetchPayrollEntries();
      showToast('Payroll entry approved', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to approve entry', 'error');
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedEntry) return;

    try {
      await markPayrollEntryPaid(selectedEntry._id, paymentData);
      setShowPaymentModal(false);
      setSelectedEntry(null);
      fetchPayrollEntries();
      showToast('Payment recorded successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to record payment', 'error');
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!selectedPeriod) {
      showToast('Please select a payroll period first', 'warning');
      return;
    }

    try {
      const blob = await exportPayroll(selectedPeriod, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payroll-${selectedPeriod}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(`Payroll exported as ${format.toUpperCase()}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export payroll', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalGross = entries.reduce((sum, entry) => sum + entry.grossSalary, 0);
  const totalNet = entries.reduce((sum, entry) => sum + entry.netSalary, 0);
  const totalDeductions = entries.reduce((sum, entry) => sum + entry.deductions.total, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Details</h1>
          <p className="text-gray-600 mt-1">Detailed payroll information and payment tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Select Payroll Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a period...</option>
            {/* This would be populated from payroll periods API */}
          </select>
        </div>
      </div>

      {selectedPeriod && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Gross</p>
                  <p className="text-xl font-bold text-gray-900">{formatXAF(totalGross)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Deductions</p>
                  <p className="text-xl font-bold text-gray-900">{formatXAF(totalDeductions)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Net</p>
                  <p className="text-xl font-bold text-gray-900">{formatXAF(totalNet)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Staff Count</p>
                  <p className="text-xl font-bold text-gray-900">{entries.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Entries Table */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payroll Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours/Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
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
                  {entries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {typeof entry.staff === 'string' ? 'S' : 
                               entry.staff.names.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {typeof entry.staff === 'string' ? entry.staff : entry.staff.names}
                            </div>
                            <div className="text-sm text-gray-500">
                              {typeof entry.staff === 'string' ? '' : entry.staff.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.hoursWorked > 0 ? (
                            <div>
                              <div>{entry.hoursWorked}h worked</div>
                              <div className="text-xs text-gray-500">
                                @ {formatXAF(entry.hourlyRate)}/hour
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div>Fixed Salary</div>
                              <div className="text-xs text-gray-500">Monthly</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatXAF(entry.grossSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Tax: {formatXAF(entry.deductions.tax)}</div>
                          <div>Insurance: {formatXAF(entry.deductions.insurance)}</div>
                          <div className="font-medium">Total: {formatXAF(entry.deductions.total)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatXAF(entry.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {getStatusIcon(entry.status)}
                          <span className="ml-1 capitalize">{entry.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {entry.status === 'draft' && (
                            <button
                              onClick={() => handleApproveEntry(entry._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {entry.status === 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setShowPaymentModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                              title="Mark as Paid"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {entries.length === 0 && !loading && (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No payroll entries</h3>
                <p className="text-sm text-gray-500">
                  {selectedPeriod 
                    ? 'No payroll entries found for the selected period.'
                    : 'Select a payroll period to view entries.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
              <p className="text-sm text-gray-600 mt-1">
                {typeof selectedEntry.staff === 'string' ? selectedEntry.staff : selectedEntry.staff.names} - 
                {formatXAF(selectedEntry.netSalary)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="check">Check</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional payment notes"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedEntry(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDetailsPage;