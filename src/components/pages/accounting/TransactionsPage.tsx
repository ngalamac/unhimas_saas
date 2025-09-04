import React, { useEffect, useState } from 'react';
import { Search, Download, Plus, Edit, Trash2 } from 'lucide-react';
import TransactionForm from './TransactionForm';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import fetchClient from '../../../lib/fetchClient';

type Tx = {
  _id: string;
  date: string;
  category: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  registeredBy?: { name?: string; email?: string } | string;
  branch?: { name?: string } | string;
  reference?: string;
  paymentMethod?: string;
  status?: string;
};

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ 
    category: '', 
    from: '', 
    to: '', 
    type: '',
    status: '',
    search: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Tx | null>(null);

  useAuth();
  useBranch();

  const fetchPage = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ 
        page: String(p), 
        limit: String(limit) 
      });
      
      if (filters.category) q.set('category', filters.category);
      if (filters.from) q.set('from', filters.from);
      if (filters.to) q.set('to', filters.to);
      if (filters.type) q.set('type', filters.type);
      if (filters.status) q.set('status', filters.status);
      if (filters.search) q.set('search', filters.search);
      
      const res = await fetchClient.get(`/api/accounting?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      
      const j = await res.json();
      setTransactions(j.data || []);
      setTotal(j.meta?.total || 0);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPage(1).catch(() => {}); 
  }, [filters]);

  const onCreated = () => { 
    fetchPage(1).catch(()=>{}); 
    setShowForm(false);
    setEditingTransaction(null);
  };

  const onCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: Tx) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const res = await fetchClient.delete(`/api/accounting/${id}`);
      if (res.ok) {
        fetchPage(page);
      } else {
        setError('Failed to delete transaction');
      }
    } catch (err) {
      setError('Error deleting transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (type: 'income' | 'expense') => {
    return type === 'income' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? '↗' : '↘';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage all financial transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <TransactionForm 
              onCreated={onCreated}
              onCancel={onCancel}
              initialData={editingTransaction}
              showTrigger={false}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {/* Income */}
            <option value="Registration fees">Registration fees</option>
            <option value="Tuition Fees">Tuition Fees</option>
            <option value="Examination fees">Examination fees</option>
            <option value="Internship fees">Internship fees</option>
            <option value="Cafeteria income">Cafeteria income</option>
            <option value="Donations, grants, and sponsorships">Donations, grants, and sponsorships</option>
            <option value="Rent of Campus">Rent of Campus</option>
            <option value="IT Boot camp">IT Boot camp</option>
            <option value="Miscellaneous">Miscellaneous</option>
            {/* Expense */}
            <option value="Payroll Expenses">Payroll Expenses</option>
            <option value="Utilities">Utilities</option>
            <option value="Publicity Expense">Publicity Expense</option>
            <option value="Examination expenses">Examination expenses</option>
            <option value="Repairs & maintenance">Repairs & maintenance</option>
            <option value="Teaching materials">Teaching materials</option>
            <option value="Laboratory supplies">Laboratory supplies</option>
            <option value="internship expense">internship expense</option>
            <option value="Transport">Transport</option>
            <option value="Events & extracurricular activities">Events & extracurricular activities</option>
            <option value="Administrative expenses">Administrative expenses</option>
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="From Date"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="To Date"
          />

          <button 
            onClick={() => setFilters({ category: '', from: '', to: '', type: '', status: '', search: '' })}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.type)}`}>
                        {getStatusIcon(tx.type)} {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {tx.description || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof tx.branch === 'string' ? tx.branch : tx.branch?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof tx.registeredBy === 'string' ? tx.registeredBy : tx.registeredBy?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {transactions.length} of {total} transactions
        </div>
        <div className="flex items-center space-x-2">
          <button 
            disabled={page <= 1 || loading}
            onClick={() => { const v = Math.max(1, page - 1); setPage(v); fetchPage(v); }} 
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="px-3 py-1 border border-gray-300 rounded text-sm bg-white">
            {page} / {Math.ceil(total / limit)}
          </div>
          <button 
            disabled={page >= Math.ceil(total / limit) || loading}
            onClick={() => { const v = page + 1; setPage(v); fetchPage(v); }} 
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
