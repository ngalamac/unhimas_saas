import React from 'react';
import { DollarSign, CreditCard, TrendingUp, AlertCircle, FileText, Users } from 'lucide-react';
import { mockPayments, mockFeeStructures, mockStudents, getCurrentBatchData } from '../../data/mockData';
import { formatXAF } from '../../utils/currency';

export const AccountantDashboard: React.FC = () => {
  const currentBatch = getCurrentBatchData();
  const totalRevenue = mockPayments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = mockPayments.filter(p => p.status === 'Pending');
  const unpaidStudents = mockStudents.filter(s => s.tuitionStatus === 'Unpaid');
  const partialPayments = mockStudents.filter(s => s.tuitionStatus === 'Partial');

  const formatCurrency = (amount: number) => formatXAF(amount);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h1>
          <p className="text-gray-600">Financial management and fee tracking</p>
          <p className="text-sm text-blue-600">Current Batch: {currentBatch?.name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{new Date().toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-600">↗ +15% this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{pendingPayments.length}</p>
              <p className="text-xs text-yellow-600">Requires processing</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unpaid Students</p>
              <p className="text-2xl font-bold text-gray-900">{unpaidStudents.length}</p>
              <p className="text-xs text-red-600">Needs follow-up</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Partial Payments</p>
              <p className="text-2xl font-bold text-gray-900">{partialPayments.length}</p>
              <p className="text-xs text-orange-600">In progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Process Payment</span>
            </button>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Financial Report</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {mockPayments.slice(0, 3).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-gray-500">{payment.paymentMethod}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  payment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Bank Transfer</span>
              <span className="font-medium">45%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Mobile Money</span>
              <span className="font-medium">30%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Cash</span>
              <span className="font-medium">20%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Online</span>
              <span className="font-medium">5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Payments */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Payments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unpaidStudents.slice(0, 5).map((student) => {
                const feeStructure = mockFeeStructures.find(f => 
                  f.programId === student.program.id && f.level === student.level
                );
                return (
                  <tr key={student.id}>
                    <td className="px-4 py-2">
                      <div>
                        <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {student.program.type} - Level {student.level}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {formatCurrency(feeStructure?.totalFee || 0)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        {student.tuitionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};