import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../../context/NavigationContext';
import { formatXAF } from '../../../utils/currency';

const AccountingOverview: React.FC = () => {
  const { setCurrentPage } = useNavigation();
  const [loading, setLoading] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [count, setCount] = useState(0);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'none'|'month'>('none');
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => { fetchSummary(); }, []);

  async function fetchSummary() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (groupBy && groupBy !== 'none') params.set('groupBy', groupBy);
      const res = await fetch(`/api/transactions/summary?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load summary');
      const j = await res.json();
      const d = j.data || {};
      if (groupBy === 'month') {
        setSeries(Array.isArray(d) ? d : []);
        // compute totals from series as fallback
        const income = (d || []).reduce((s: number, r: any) => s + Number(r.totalIncome || 0), 0);
        const expense = (d || []).reduce((s: number, r: any) => s + Number(r.totalExpense || 0), 0);
        setTotalIncome(income);
        setTotalExpense(expense);
        setCount((d || []).reduce((s: number, r: any) => s + Number(r.count || 0), 0));
      } else {
        setTotalIncome(Number(d.totalIncome || 0));
        setTotalExpense(Number(d.totalExpense || 0));
        setCount(Number(d.count || 0));
        setSeries([]);
      }
    } catch (err) {
      console.warn('Accounting overview load failed', err);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Finance Overview</h1>
          <p className="text-sm text-gray-500">Snapshot of your accounting — {count} transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setCurrentPage('transactions')} className="px-3 py-2 bg-blue-600 text-white rounded">View Transactions</button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div>
          <label className="text-xs text-gray-500">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="ml-2 border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="ml-2 border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Group By</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)} className="ml-2 border rounded px-2 py-1 text-sm">
            <option value="none">None</option>
            <option value="month">Month</option>
          </select>
        </div>
        <div>
          <button onClick={() => fetchSummary()} className="ml-2 px-3 py-1 bg-gray-100 border rounded">Apply</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-xs text-gray-500">Total Income</div>
          <div className="text-xl font-semibold">{formatXAF(totalIncome)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-xs text-gray-500">Total Expenses</div>
          <div className="text-xl font-semibold">{formatXAF(totalExpense)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-xs text-gray-500">Net</div>
          <div className="text-xl font-semibold">{formatXAF(totalIncome - totalExpense)}</div>
        </div>
      </div>
      <div className="mt-6 text-sm text-gray-500">{loading ? 'Loading...' : ''}</div>

      {groupBy === 'month' && series.length > 0 && (
        <div className="mt-6 bg-white rounded border p-4">
          <h3 className="font-semibold mb-2">Monthly breakdown</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Month</th>
                  <th className="px-2 py-1 text-right">Income</th>
                  <th className="px-2 py-1 text-right">Expense</th>
                  <th className="px-2 py-1 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {series.map(s => (
                  <tr key={s.label} className="border-b">
                    <td className="px-2 py-1">{s.label}</td>
                    <td className="px-2 py-1 text-right">{formatXAF(s.totalIncome)}</td>
                    <td className="px-2 py-1 text-right">{formatXAF(s.totalExpense)}</td>
                    <td className="px-2 py-1 text-right">{formatXAF(s.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingOverview;
