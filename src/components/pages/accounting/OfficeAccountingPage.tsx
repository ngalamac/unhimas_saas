import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Calendar, FileText } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference: string;
  createdBy: string;
}

export const OfficeAccountingPage: React.FC = () => {
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'Income',
      category: 'Fee Collection',
      amount: 2450000,
      description: 'Student tuition fees - December 2024',
      date: '2024-12-01',
      reference: 'INC-2024-001',
      createdBy: 'Accounts'
    },
    {
      id: '2',
      type: 'Expense',
      category: 'Staff Salaries',
      amount: 1250000,
      description: 'Monthly staff salaries - December 2024',
      date: '2024-12-01',
      reference: 'EXP-2024-001',
      createdBy: 'HR'
    },
    {
      id: '3',
      type: 'Income',
      category: 'Registration Fees',
      amount: 350000,
      description: 'New student registration fees',
      date: '2024-12-05',
      reference: 'INC-2024-002',
      createdBy: 'Admissions'
    },
    {
      id: '4',
      type: 'Expense',
      category: 'Utilities',
      amount: 185000,
      description: 'Electricity and water bills',
      date: '2024-12-10',
      reference: 'EXP-2024-002',
      createdBy: 'Admin'
    },
    {
      id: '5',
      type: 'Expense',
      category: 'Equipment',
      amount: 450000,
      description: 'Computer lab equipment purchase',
      date: '2024-12-12',
      reference: 'EXP-2024-003',
      createdBy: 'IT'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'Income' as 'Income' | 'Expense',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalExpenses;

  const incomeCategories = [
    'Fee Collection',
    'Registration Fees',
    'Exam Fees',
    'Library Fees',
    'Other Income'
  ];

  const expenseCategories = [
    'Staff Salaries',
    'Utilities',
    'Equipment',
    'Maintenance',
    'Marketing',
    'Office Supplies',
    'Other Expenses'
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Office Accounting</h1>
          <p className="text-gray-600">Track income, expenses, and financial performance</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              netIncome >= 0 ? 'bg-blue-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-5 h-5 ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netIncome)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-lg font-bold text-gray-900">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'Income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {transaction.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.createdBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Transaction</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as 'Income' | 'Expense'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {(newTransaction.type === 'Income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (XAF)</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};