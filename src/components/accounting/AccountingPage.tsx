import React, { useEffect, useState } from 'react';
import { formatXAF } from '../../utils/currency';
import { incomeCategories, expenseCategories } from '../../data/accountingCategories';

type TxType = 'income' | 'expense';
interface Transaction {
  _id?: string;
  type: TxType;
  category: string;
  amount: number;
  description?: string;
  date?: string;
  reference?: string;
  createdBy?: string;
  property?: string;
  staffId?: string;
  staffName?: string;
  studentId?: string;
  studentName?: string;
}


const AccountingPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  // UI state
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all'|'income'|'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTx, setNewTx] = useState<Transaction>({ type: 'income', category: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv'|'xlsx'|'pdf'|'doc'|'email'>('csv');
  const [exportEmail, setExportEmail] = useState('');
  // Staff & students (fetched from backend; creation happens elsewhere)
  const [staff, setStaff] = useState<{ id: string; name: string; role?: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);

  // selection state for bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { fetchTransactions(1); }, []);
  useEffect(() => { fetchStaffAndStudents(); }, []);

  async function fetchStaffAndStudents() {
    try {
      const [sRes, stRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/students'),
      ]);
      if (sRes.ok) {
        const sjson = await sRes.json();
        setStaff(Array.isArray(sjson.data || sjson) ? (sjson.data || sjson) : []);
      } else {
        setStaff([]);
      }
      if (stRes.ok) {
        const stjson = await stRes.json();
        setStudents(Array.isArray(stjson.data || stjson) ? (stjson.data || stjson) : []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.warn('Failed to load staff/students', err);
      setStaff([]);
      setStudents([]);
    }
  }

  async function fetchTransactions(p = 1) {
    try {
      setLoading(true);
      const res = await fetch(`/api/transactions?page=${p}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const wrapper = await res.json();
      const mapped: Transaction[] = (wrapper.data || []).map((t: any) => ({
        _id: t._id,
        type: t.type === 'income' ? 'income' : 'expense',
        category: t.category,
        amount: t.amount,
        description: t.description,
        date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
        reference: t.reference,
        createdBy: t.createdBy,
        property: t.property,
        staffId: t.staffId?._id || t.staffId || undefined,
        staffName: t.staffId?.name || t.staffName || undefined,
        studentId: t.studentId?._id || t.studentId || undefined,
        studentName: t.studentId?.name || t.studentName || undefined
      }));
      setTransactions(mapped);
      setTotal(wrapper.meta?.total || mapped.length);
      setPage(p);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch transactions');
    } finally { setLoading(false); }
  }

  const filtered = transactions.filter(t => {
    if (activeTab === 'income' && t.type !== 'income') return false;
    if (activeTab === 'expense' && t.type !== 'expense') return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (query && !(`${t.description || ''} ${t.category} ${t.reference || ''} ${t.createdBy || ''}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // CRUD
  async function createTx(payload: Partial<Transaction>) {
    const body = { ...payload, type: payload.type } as any;
    const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Create failed');
    await fetchTransactions(1);
  }

  async function updateTx(id: string, payload: Partial<Transaction>) {
    const res = await fetch(`/api/transactions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Update failed');
    await fetchTransactions(page);
  }

  async function deleteTx(id?: string) {
    if (!id) return;
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    await fetchTransactions(1);
  }

  // Bulk actions
  async function handleBulkDelete() {
    if (selected.size === 0) { setError('No items selected'); return; }
    if (!confirm(`Delete ${selected.size} selected transactions?`)) return;
    try {
      const ids = Array.from(selected).filter(Boolean);
      await Promise.all(ids.map(id => fetch(`/api/transactions/${id}`, { method: 'DELETE' })));
      setSelected(new Set());
      await fetchTransactions(1);
    } catch (err: any) {
      setError(err.message || 'Bulk delete failed');
    }
  }

  function handleBulkExportCSV() {
    if (selected.size === 0) { setError('No items selected'); return; }
    const ids = new Set(Array.from(selected));
    const rows = transactions.filter(t => ids.has(t._id || ''));
    if (rows.length === 0) { setError('Selected items not in current page'); return; }
    const headers = ['reference','date','type','category','amount','description','createdBy','property'];
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
      const v = (r as any)[h] ?? '';
      return typeof v === 'string' ? `"${v.replace(/"/g,'""')}"` : v;
    }).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Import
  async function handleImport() {
    if (!importFile) { setError('Select file'); return; }
    const fd = new FormData(); fd.append('file', importFile);
    const res = await fetch('/api/transactions/import', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Import failed');
    const j = await res.json();
    setError(`Imported ${j.created || j.created.length || j.created}`);
    await fetchTransactions(1);
  }

  // Export
  function handleExport() {
    if (exportFormat === 'email') {
      if (!exportEmail) { setError('Provide email'); return; }
      fetch(`/api/transactions/export?format=email&email=${encodeURIComponent(exportEmail)}`).then(r => { if (!r.ok) setError('Email failed'); else setError('Email sent'); });
      return;
    }
    window.open(`/api/transactions/export?format=${exportFormat}`, '_blank');
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Accounting</h1>
          <p className="text-sm text-gray-500">Office accounting overview • {total} transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-xs text-gray-500">Income</div>
            <div className="font-semibold">{formatXAF(totalIncome)}</div>
          </div>
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-xs text-gray-500">Expenses</div>
            <div className="font-semibold">{formatXAF(totalExpense)}</div>
          </div>
          <button onClick={() => setShowAdd(true)} disabled={loading} className={`px-3 py-2 ${loading ? 'bg-blue-300' : 'bg-blue-600'} text-white rounded`}>Add</button>
        </div>
      </div>

      {/* Toolbar */}
  <div className="flex items-center space-x-2 mb-3">
        <div className="flex items-center bg-gray-50 rounded px-3 py-2 w-96">
          <SearchIcon />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="ml-2 outline-none bg-transparent w-full text-sm" />
        </div>
        <select value={activeTab} onChange={e => setActiveTab(e.target.value as any)} className="px-3 py-2 border rounded">
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">All Categories</option>
          {(activeTab === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => fetchTransactions(1)} className="px-3 py-2 border rounded">Refresh</button>
  <div className="border-l pl-2" />
  <button onClick={() => handleBulkExportCSV()} className="px-3 py-2 border rounded">Export selected (CSV)</button>
  <button onClick={() => handleBulkDelete()} className="px-3 py-2 bg-red-100 text-red-700 border rounded">Delete selected</button>
        <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="ml-auto px-3 py-2 border rounded">
          <option value="csv">CSV</option>
          <option value="xlsx">Excel</option>
          <option value="pdf">PDF</option>
          <option value="doc">Word</option>
          <option value="email">Email</option>
        </select>
        {exportFormat === 'email' && <input value={exportEmail} onChange={e => setExportEmail(e.target.value)} placeholder="email@example.com" className="px-3 py-2 border rounded" />}
        <button onClick={handleExport} className="px-3 py-2 bg-blue-600 text-white rounded">Export</button>
        <label className="px-3 py-2 bg-white border rounded cursor-pointer">
          <input type="file" accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} className="hidden" />
          Import
        </label>
        <button onClick={handleImport} className="px-3 py-2 bg-green-600 text-white rounded">Upload</button>
      </div>

      <div className="bg-white rounded border overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left w-8"><input type="checkbox" onChange={e => { if (e.target.checked) { setSelected(new Set(filtered.map(t => t._id || ''))); } else { setSelected(new Set()); } }} checked={filtered.length > 0 && filtered.every(t => selected.has(t._id || ''))} /></th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Due</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Property</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tx => (
              <tr key={tx._id || tx.reference} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2"><input type="checkbox" checked={selected.has(tx._id || '')} onChange={e => { const s = new Set(selected); const id = tx._id || ''; if (e.target.checked) s.add(id); else s.delete(id); setSelected(s); }} /></td>
                <td className="px-3 py-2">{tx.type === 'income' ? <span className="text-green-700">Income</span> : <span className="text-red-700">Expense</span>}</td>
                <td className="px-3 py-2">{tx.date}</td>
                <td className="px-3 py-2"><div className="font-medium">{tx.description || '—'}</div><div className="text-xs text-gray-500">Ref: {tx.reference || '—'}</div></td>
                <td className="px-3 py-2">{tx.category}</td>
                <td className="px-3 py-2">{tx.property || '—'}</td>
                <td className="px-3 py-2">{tx.staffName ? `${tx.staffName} (staff)` : tx.studentName ? `${tx.studentName} (student)` : (tx.createdBy || '—')}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatXAF(tx.amount)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => { setEditTx(tx); }} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Edit</button>
                    <button onClick={() => { if (confirm('Delete?')) deleteTx(tx._id); }} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded w-full max-w-md p-4">
            <h3 className="font-semibold mb-2">Add Transaction</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm">Type</label>
                <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value as TxType})} className="w-full border rounded p-2">
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Category</label>
                <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="w-full border rounded p-2">
                  <option value="">Select</option>
                  {(newTx.type === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Assignee when relevant (e.g., Salary or Student fees) */}
              {(newTx.category?.toLowerCase().includes('salary') || newTx.category?.toLowerCase().includes('staff')) && (
                <div>
                  <label className="block text-sm">Assign to staff</label>
                  <select value={(newTx as any).staffId || ''} onChange={e => setNewTx({...newTx, staffId: e.target.value})} className="w-full border rounded p-2">
                    <option value="">Select staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                  </select>
                </div>
              )}
      {(newTx.category?.toLowerCase().includes('fee') || newTx.category?.toLowerCase().includes('tuition')) && (
                <div>
                  <label className="block text-sm">Student</label>
                  <div className="flex space-x-2">
        <select value={(newTx as any).studentId || ''} onChange={e => setNewTx({...newTx, studentId: e.target.value})} className="flex-1 border rounded p-2">
                      <option value="">Select student</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="text-xs text-gray-400 px-2">Manage students in the Students page</div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm">Amount</label>
                <input type="number" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">Description</label>
                <input value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={() => setShowAdd(false)} className="px-3 py-2 border rounded">Cancel</button>
                <button onClick={async () => { try { if (!newTx.category || newTx.amount <= 0) { setError('Fill required'); return; } const body: any = { ...newTx, type: newTx.type }; if ((newTx as any).staffId) body.staffId = (newTx as any).staffId; if ((newTx as any).studentId) body.studentId = (newTx as any).studentId; await createTx(body); setShowAdd(false); setNewTx({ type: 'income', category: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); } catch (err: any) { setError(err.message || 'Create failed'); } }} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded w-full max-w-md p-4">
            <h3 className="font-semibold mb-2">Edit Transaction</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm">Category</label>
                <select value={editTx.category} onChange={e => setEditTx({...editTx, category: e.target.value})} className="w-full border rounded p-2">
                  {(editTx.type === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {(editTx.category?.toLowerCase().includes('salary') || editTx.category?.toLowerCase().includes('staff')) && (
                <div>
                  <label className="block text-sm">Assign to staff</label>
                  <select value={(editTx as any).staffId || ''} onChange={e => setEditTx({...editTx, staffId: e.target.value})} className="w-full border rounded p-2">
                    <option value="">Select staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                  </select>
                </div>
              )}
              {(editTx.category?.toLowerCase().includes('fee') || editTx.category?.toLowerCase().includes('tuition')) && (
                <div>
                  <label className="block text-sm">Student</label>
                  <select value={(editTx as any).studentId || ''} onChange={e => setEditTx({...editTx, studentId: e.target.value})} className="w-full border rounded p-2">
                    <option value="">Select student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm">Amount</label>
                <input type="number" value={editTx.amount} onChange={e => setEditTx({...editTx, amount: Number(e.target.value)})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">Description</label>
                <input value={editTx.description} onChange={e => setEditTx({...editTx, description: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={() => setEditTx(null)} className="px-3 py-2 border rounded">Cancel</button>
                <button onClick={async () => { try { if (!editTx || !editTx._id) return; const body: any = { ...editTx }; if ((editTx as any).staffId) body.staffId = (editTx as any).staffId; if ((editTx as any).studentId) body.studentId = (editTx as any).studentId; await updateTx(editTx._id, body); setEditTx(null); } catch (err: any) { setError(err.message || 'Update failed'); } }} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

  {/* Staff management is handled on the Students/Staff pages; accounting only links to existing users */}
    </div>
  );
};

// small inline search icon to avoid extra imports
const SearchIcon: React.FC = () => (<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>);

export default AccountingPage;
