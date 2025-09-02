import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { formatXAF } from '../../../utils/currency';
import { incomeCategories as defaultIncomeCategories, expenseCategories as defaultExpenseCategories } from '../../../data/accountingCategories';

interface Transaction {
  _id?: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
  createdBy?: string;
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const { setCurrentPage, setBreadcrumb } = useNavigation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [total, setTotal] = useState(0);

    // UI state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTransaction, setNewTransaction] = useState({ type: 'Income' as 'Income' | 'Expense', category: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
    const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'income' | 'chart'>('overview');
    const [query, setQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [range, setRange] = useState({ from: '', to: '' });
    const [importFile, setImportFile] = useState<File | null>(null);
    const [exportFormat, setExportFormat] = useState<'csv'|'xlsx'|'pdf'|'doc'|'email'>('csv');
    const [exportEmail, setExportEmail] = useState('');

    const incomeCategories = defaultIncomeCategories;
    const expenseCategories = defaultExpenseCategories;

    useEffect(() => { fetchTransactions(1); /* eslint-disable-next-line */ }, []);

    const fetchTransactions = async (p = 1) => {
      try {
        setLoading(true);
        const resp = await fetch(`/api/transactions?page=${p}&limit=${limit}`);
        if (!resp.ok) throw new Error('Failed to load transactions');
        const wrapper = await resp.json();
        const data = wrapper.data || [];
        setTotal(wrapper.meta?.total || 0);
        const mapped: Transaction[] = data.map((t: any) => ({
          _id: t._id,
          type: t.type === 'income' ? 'Income' : 'Expense',
          category: t.category,
          amount: t.amount,
          description: t.description,
          date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
          reference: t.reference,
          createdBy: t.createdBy
        }));
        setTransactions(mapped);
        setPage(p);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    const filteredTransactions = transactions.filter(t => {
      if (activeTab === 'expenses' && t.type !== 'Expense') return false;
      if (activeTab === 'income' && t.type !== 'Income') return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (query && !(`${t.description} ${t.category} ${t.reference} ${t.createdBy}`.toLowerCase().includes(query.toLowerCase()))) return false;
      if (range.from && new Date(t.date) < new Date(range.from)) return false;
      if (range.to && new Date(t.date) > new Date(range.to)) return false;
      return true;
    });

    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    const net = totalIncome - totalExpenses;

    const formatCurrency = (amount: number) => formatXAF(amount);

    return (
      <div className="p-4 md:p-6 h-[calc(100vh-96px)] flex flex-col space-y-4">
        {/* Top row: compact KPIs (left) + centered toolbar + actions (right) */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 hidden lg:flex lg:space-x-3">
            <div className="bg-white p-3 rounded shadow-sm border w-48">
              <p className="text-xs text-gray-500">Total Income</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border w-48">
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border w-48">
              <p className="text-xs text-gray-500">Net</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(net)}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
                <p className="text-sm text-gray-500">Professional tracking of income and expenses</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setShowAddForm(true)} className="px-3 py-2 bg-blue-600 text-white rounded flex items-center"><Plus className="w-4 h-4 mr-2"/>New</button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white p-3 rounded border">
              <div className="flex items-center space-x-2">
                <button onClick={() => setActiveTab('overview')} className={`px-2 py-1 text-sm rounded ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>All</button>
                <button onClick={() => setActiveTab('income')} className={`px-2 py-1 text-sm rounded ${activeTab === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Income</button>
                <button onClick={() => setActiveTab('expenses')} className={`px-2 py-1 text-sm rounded ${activeTab === 'expenses' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>Expense</button>
              </div>

              <div className="flex-1 mx-4">
                <div className="flex items-center bg-gray-50 rounded px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400 mr-2" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions, title, category, contact..." className="w-full text-sm bg-transparent outline-none" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="px-2 py-1 border rounded text-sm">
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                  <option value="pdf">PDF</option>
                  <option value="doc">Word</option>
                  <option value="email">Email</option>
                </select>
                {exportFormat === 'email' && <input value={exportEmail} onChange={e => setExportEmail(e.target.value)} placeholder="email@example.com" className="px-2 py-1 border rounded text-sm" />}
                <button onClick={async () => {
                  try {
                    if (exportFormat === 'email') {
                      if (!exportEmail) { setError('Provide email'); return; }
                      const resp = await fetch(`/api/transactions/export?format=email&email=${encodeURIComponent(exportEmail)}`);
                      if (!resp.ok) throw new Error('Email failed');
                      setError('Email queued');
                    } else {
                      window.open(`/api/transactions/export?format=${exportFormat}`, '_blank');
                    }
                  } catch (err: any) { setError(err.message || 'Export failed'); }
                }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Export</button>
                <label className="flex items-center px-3 py-1 bg-white border rounded cursor-pointer text-sm">
                  <input type="file" accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} className="hidden" />
                  Import
                </label>
                <button onClick={async () => {
                  if (!importFile) { setError('Select file'); return; }
                  const fd = new FormData(); fd.append('file', importFile);
                  try { const res = await fetch('/api/transactions/import', { method: 'POST', body: fd }); if (!res.ok) throw new Error('Import failed'); const j = await res.json(); setError(`Imported ${j.created || j.created.length || j.created} records`); await fetchTransactions(1); } catch (err: any) { setError(err.message || 'Import failed'); }
                }} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Upload</button>
              </div>
            </div>
          </div>
        </div>

        {/* Table area */}
        <div className="bg-white rounded-lg shadow-sm border flex-1 overflow-hidden">
          <div className="sticky top-0 bg-white z-10 border-b">
            <div className="p-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">Showing {filteredTransactions.length} records</div>
              <div className="text-sm text-gray-600">Page {page} of {Math.max(1, Math.ceil(total / limit))}</div>
            </div>
          </div>
          {loading && <div className="p-4 text-sm text-gray-600">Loading transactions...</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}
          <div className="overflow-auto max-h-[calc(100vh-280px)]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-12">
                <tr>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Due</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Property</th>
                  <th className="px-3 py-2 text-left">Contact</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Paid</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const isOverdue = transaction.date && new Date(transaction.date) < new Date() && transaction.type === 'Expense';
                  return (
                  <tr key={transaction._id || transaction.reference} className="hover:bg-gray-50 border-b">
                    <td className="px-3 py-2 align-top">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-800' : transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{isOverdue ? 'Overdue' : transaction.type}</span>
                    </td>
                    <td className="px-3 py-2 align-top">{transaction.date}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-gray-900">{transaction.description || '—'}</div>
                      <div className="text-xs text-gray-500">Ref: {transaction.reference || '—'}</div>
                    </td>
                    <td className="px-3 py-2 align-top">{transaction.category}</td>
                    <td className="px-3 py-2 align-top">{(transaction as any).property || '—'}</td>
                    <td className="px-3 py-2 align-top">{transaction.createdBy || '—'}</td>
                    <td className="px-3 py-2 align-top text-right font-semibold">{formatCurrency(transaction.amount)}</td>
                    <td className="px-3 py-2 align-top text-right">{transaction.type === 'Income' ? formatCurrency(transaction.amount) : formatCurrency(0)}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => { setEditTransaction(transaction); setShowEditForm(true); }} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Edit</button>
                        <button onClick={async () => {
                          if (!transaction._id) return;
                          if (!confirm('Delete this transaction?')) return;
                          try { const resp = await fetch(`/api/transactions/${transaction._id}`, { method: 'DELETE' }); if (!resp.ok) throw new Error('Delete failed'); await fetchTransactions(1); } catch (err: any) { setError(err.message || 'Delete failed'); }
                        }} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">Total: {formatCurrency(transactions.reduce((s,t)=> s + t.amount, 0))}</div>
            <div className="space-x-2">
              <button disabled={page <= 1} onClick={() => { const v = Math.max(1, page-1); fetchTransactions(v); }} className="px-3 py-1 bg-gray-100 rounded">Prev</button>
              <button disabled={page >= Math.ceil(total/limit)} onClick={() => { const v = page+1; fetchTransactions(v); }} className="px-3 py-1 bg-gray-100 rounded">Next</button>
            </div>
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
                  <select value={newTransaction.type} onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as 'Income' | 'Expense'})} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select value={newTransaction.category} onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select Category</option>
                    {(newTransaction.type === 'Income' ? incomeCategories : expenseCategories).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (XAF)</label>
                  <input type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={newTransaction.description} onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" value={newTransaction.date} onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg">Cancel</button>
                <button onClick={async () => {
                  if (!newTransaction.category || newTransaction.amount <= 0 || !newTransaction.description) { setError('Please fill required fields'); return; }
                  try {
                    const payload = { type: newTransaction.type.toLowerCase(), category: newTransaction.category, amount: newTransaction.amount, description: newTransaction.description, date: newTransaction.date };
                    const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!res.ok) throw new Error('Failed to add transaction');
                    await fetchTransactions(1);
                    setShowAddForm(false);
                    setNewTransaction({ type: 'Income', category: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
                  } catch (err: any) { console.error(err); setError(err.message || 'Failed to add transaction'); }
                }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Transaction</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showEditForm && editTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200"><h2 className="text-xl font-semibold text-gray-900">Edit Transaction</h2></div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select value={editTransaction.type} onChange={(e) => setEditTransaction({...editTransaction, type: e.target.value as 'Income'|'Expense'})} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select value={editTransaction.category} onChange={(e) => setEditTransaction({...editTransaction, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select Category</option>
                    {(editTransaction.type === 'Income' ? incomeCategories : expenseCategories).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (XAF)</label>
                  <input type="number" value={editTransaction.amount} onChange={(e) => setEditTransaction({...editTransaction, amount: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={editTransaction.description} onChange={(e) => setEditTransaction({...editTransaction, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" value={editTransaction.date} onChange={(e) => setEditTransaction({...editTransaction, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button onClick={() => { setShowEditForm(false); setEditTransaction(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg">Cancel</button>
                <button onClick={async () => {
                  if (!editTransaction || !editTransaction._id) return; try { const payload: any = { type: editTransaction.type.toLowerCase(), category: editTransaction.category, amount: editTransaction.amount, description: editTransaction.description, date: editTransaction.date }; const res = await fetch(`/api/transactions/${editTransaction._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) throw new Error('Failed to update transaction'); setShowEditForm(false); setEditTransaction(null); await fetchTransactions(1); } catch (err: any) { console.error(err); setError(err.message || 'Update failed'); }
                }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
    </div>
  );
};