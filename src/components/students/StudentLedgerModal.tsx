import React, { useEffect, useState } from 'react';
import { getStudentLedger, StudentLedgerLine } from '../../api/students';

interface Props {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  studentName?: string;
}

const fmt = (n: number | null | undefined) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '0.00';
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function StudentLedgerModal({ studentId, open, onClose, studentName }: Props) {
  const [lines, setLines] = useState<StudentLedgerLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState({ debit: 0, credit: 0, balance: 0 });
  const [period, setPeriod] = useState<string>('');

  useEffect(() => {
    if (open && studentId) {
      setLoading(true);
      setError(null);
      getStudentLedger(studentId, period ? { period } : undefined)
        .then(res => {
          const d: any = res.data || {};
          const apiLines = (d.lines || []) as any[];
          // Normalize totals (supports legacy {totals:{}} or flat fields)
          const totalDebit = d.totalDebit ?? d.totals?.debit ?? 0;
          const totalCredit = d.totalCredit ?? d.totals?.credit ?? 0;
          const balance = d.balance ?? d.totals?.balance ?? (totalDebit - totalCredit);
          // Compute running balance in display order (date ascending assumed)
          let running = 0;
          const enriched = apiLines.map(l => {
            running += (l.debit || 0) - (l.credit || 0);
            return { ...l, runningBalance: running };
          });
          setLines(enriched);
          setTotals({ debit: totalDebit, credit: totalCredit, balance });
        })
        .catch(e => setError(e.message || 'Failed to load ledger'))
        .finally(() => setLoading(false));
    } else if (!open) {
      setLines([]); setTotals({ debit: 0, credit: 0, balance: 0 });
    }
  }, [open, studentId, period]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Student Ledger {studentName ? `— ${studentName}` : ''}</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
        </div>
        <div className="px-5 py-3 flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium mb-1">Period (YYYY-MM)</label>
            <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2025-09" className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700" />
          </div>
          <button onClick={() => { if (studentId) { setLoading(true); getStudentLedger(studentId, period ? { period } : undefined).then(r => { setLines(r.data.lines); setTotals({ debit: r.data.totalDebit, credit: r.data.totalCredit, balance: r.data.balance }); }).catch(e => setError(e.message || 'Failed to reload ledger')).finally(() => setLoading(false)); } }} className="mt-5 inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded">Reload</button>
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
          <div className="ml-auto flex gap-6 text-sm">
            <div>Debit: <span className="font-semibold">{fmt(totals.debit)}</span></div>
            <div>Credit: <span className="font-semibold">{fmt(totals.credit)}</span></div>
            <div>Balance: <span className={`font-semibold ${totals.balance < 0 ? 'text-red-600' : ''}`}>{fmt(totals.balance)}</span></div>
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/60">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Ref</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Account</th>
                <th className="px-3 py-2 font-medium text-right">Debit</th>
                <th className="px-3 py-2 font-medium text-right">Credit</th>
                <th className="px-3 py-2 font-medium text-right">Run Bal</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-500">No ledger entries</td></tr>
              )}
              {lines.map((ln, idx) => (
                <tr key={idx} className="border-t border-gray-100 dark:border-gray-700/50">
                  <td className="px-3 py-1.5 whitespace-nowrap">{new Date(ln.date).toLocaleDateString()}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap font-mono text-xs">{ln.reference}</td>
                  <td className="px-3 py-1.5">{ln.description}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{ln.accountCode} — {ln.accountName}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{ln.debit ? fmt(ln.debit) : ''}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{ln.credit ? fmt(ln.credit) : ''}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt(ln.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 flex justify-end border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 text-sm font-medium px-4 py-2 rounded">Close</button>
        </div>
      </div>
    </div>
  );
}
