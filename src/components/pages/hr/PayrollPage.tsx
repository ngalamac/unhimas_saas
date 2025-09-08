import React, { useEffect, useState } from 'react';
import fetchClient from '../../../lib/fetchClient';

interface PayrollRun {
  id: string;
  date: string;
  staffId: string;
  staffName?: string;
  amount: number;
  notes?: string;
}

const PayrollPage: React.FC = () => {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ staffId: '', amount: 0, notes: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      setLoading(true);
  const [pRes, sRes] = await Promise.all([fetchClient.get('/api/payroll'), fetchClient.get('/api/staff')]);
      if (pRes.ok) {
        const pj = await pRes.json();
        setRuns(Array.isArray(pj.data || pj) ? (pj.data || pj).map((r: any) => ({ id: r._id || r.id, date: r.date || r.createdAt || '', staffId: r.staffId, staffName: r.staffName, amount: r.amount, notes: r.notes })) : []);
      }
      if (sRes.ok) {
        const sj = await sRes.json();
        setStaff(Array.isArray(sj.data || sj) ? (sj.data || sj).map((s: any) => ({ id: s._id || s.id, name: s.name })) : []);
      }
    } catch (err) {
      console.warn(err);
      setError(err instanceof Error ? err.message : 'Failed to load payroll or staff');
    } finally { setLoading(false); }
  }

  async function createRun() {
    try {
      if (!form.staffId || form.amount <= 0) { setError('Select staff and amount'); return; }
  const res = await fetchClient.postJson('/api/payroll', { staffId: form.staffId, amount: form.amount, notes: form.notes });
      if (!res.ok) {
        await handleFetchError(res);
        return;
      }
      setForm({ staffId: '', amount: 0, notes: '' });
      setShowAdd(false);
      await fetchAll();
    } catch (err: any) { setError(err.message || 'Create failed'); }
  }

  async function remove(id: string) {
    if (!confirm('Delete payroll run?')) return;
    try {
  const res = await fetchClient.delete(`/api/payroll/${id}`);
      if (!res.ok) {
        await handleFetchError(res);
        return;
      }
      await fetchAll();
    } catch (err: any) { setError(err.message || 'Delete failed'); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Payroll</h2>
          <p className="text-sm text-gray-500">Run payroll and manage salary disbursements.</p>
        </div>
        <div>
          <button onClick={() => setShowAdd(true)} className="px-3 py-1 bg-blue-600 text-white rounded">New Run</button>
        </div>
      </div>

      {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded">{error}</div>}

      <div className="bg-white border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Staff</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-left">Notes</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="p-4">Loading…</td></tr> : (
              runs.length === 0 ? <tr><td colSpan={5} className="p-4 text-gray-500">No payroll runs</td></tr> : (
                runs.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-2">{r.staffName || staff.find(s => s.id === r.staffId)?.name || '—'}</td>
                    <td className="p-2 text-right">{r.amount.toLocaleString()}</td>
                    <td className="p-2">{r.notes || '—'}</td>
                    <td className="p-2"><button onClick={() => remove(r.id)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button></td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded w-full max-w-md p-4">
            <h3 className="font-semibold mb-2">New Payroll Run</h3>
            <div className="space-y-2">
              <label className="block text-sm">Staff</label>
              <select value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} className="w-full border rounded p-2">
                <option value="">Select staff</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <label className="block text-sm">Amount</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border rounded p-2" />
              <label className="block text-sm">Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded p-2" />
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={() => setShowAdd(false)} className="px-3 py-1 border rounded">Cancel</button>
                <button onClick={createRun} className="px-3 py-1 bg-blue-600 text-white rounded">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
