import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { formatXAF } from '../../utils/currency';

const BalanceSheet: React.FC<{ onClose?: () => void, branch?: string }> = ({ onClose, branch }) => {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ assets: number; liabilities: number; equity: number } | null>(null);
  const [incomeBreakdown, setIncomeBreakdown] = useState<Array<{ _id: string; total: number }>>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<Array<{ _id: string; total: number }>>([]);

  const [language, setLanguage] = useState<'en'|'fr'>('en');
  const [exportFormat, setExportFormat] = useState<'pdf'|'excel'|'csv'|'email'>('pdf');
  const [exportEmail, setExportEmail] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (branch) params.set('branch', branch);

      // Fetch income and expense breakdowns in parallel for a richer table
      const [incRes, expRes, bsRes] = await Promise.all([
        fetchClient.get(`/api/accounting/reports/income-statement?${params.toString()}`),
        fetchClient.get(`/api/accounting/reports/expense-statement?${params.toString()}`),
        fetchClient.get(`/api/accounting/reports/balance-sheet?${params.toString()}`)
      ]);

      if (!incRes.ok || !expRes.ok || !bsRes.ok) throw new Error('Failed to fetch report data');

      const incJson = await incRes.json();
      const expJson = await expRes.json();
      const bsJson = await bsRes.json();

      setIncomeBreakdown(Array.isArray(incJson.breakdown) ? incJson.breakdown : (incJson.breakdown || []));
      setExpenseBreakdown(Array.isArray(expJson.breakdown) ? expJson.breakdown : (expJson.breakdown || []));
      setData(bsJson || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
      setData(null);
      setIncomeBreakdown([]);
      setExpenseBreakdown([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      // Validate email when needed
      if (exportFormat === 'email' && !exportEmail) {
        setError('Provide an email address to send the report');
        setExporting(false);
        return;
      }

      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (branch) params.set('branch', branch);
      params.set('lang', language);

      if (exportFormat === 'email') {
        // include both 'to' and 'email' for compatibility with backend variations
        params.set('to', exportEmail);
        params.set('email', exportEmail);
        params.set('format', 'email');
        const resp = await fetchClient.get(`/api/accounting/export?${params.toString()}`);
        if (!resp.ok) {
          setError('Failed to queue email');
        } else {
          setError('Email queued');
        }
        setExporting(false);
        return;
      }

      params.set('format', exportFormat === 'excel' ? 'excel' : (exportFormat === 'pdf' ? 'pdf' : 'csv'));
      const resp = await fetchClient.get(`/api/accounting/export?${params.toString()}`);
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();

      const ext = exportFormat === 'excel' ? 'xlsx' : (exportFormat === 'pdf' ? 'pdf' : 'csv');
      const filename = `balance-sheet-${Date.now()}.${ext}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Balance Sheet</h3>
          <div className="flex items-center space-x-2">
            <button onClick={onClose} className="text-gray-500">Close</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm block">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="text-sm block">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full border rounded p-2" />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm block mb-1">Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value as any)} className="w-full border rounded p-2">
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <button onClick={fetchReport} className="px-3 py-2 bg-blue-600 text-white rounded">Refresh</button>
          <button onClick={() => { setFrom(''); setTo(''); fetchReport(); }} className="px-3 py-2 border rounded">Reset</button>
        </div>

        <div className="mb-4">
          <label className="text-sm block mb-1">Export format</label>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2"><input type="radio" name="format" value="pdf" checked={exportFormat === 'pdf'} onChange={() => setExportFormat('pdf')} /> <span>PDF</span></label>
            <label className="flex items-center space-x-2"><input type="radio" name="format" value="excel" checked={exportFormat === 'excel'} onChange={() => setExportFormat('excel')} /> <span>Excel</span></label>
            <label className="flex items-center space-x-2"><input type="radio" name="format" value="csv" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} /> <span>CSV</span></label>
            <label className="flex items-center space-x-2"><input type="radio" name="format" value="email" checked={exportFormat === 'email'} onChange={() => setExportFormat('email')} /> <span>Email</span></label>
          </div>
        </div>

        {exportFormat === 'email' && (
          <div className="mb-4">
            <label className="text-sm block mb-1">Email address</label>
            <input type="email" value={exportEmail} onChange={e => setExportEmail(e.target.value)} className="w-full border rounded p-2" placeholder="recipient@example.com" />
          </div>
        )}

        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

        {data && (
          <div className="mt-4 mb-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-sm font-semibold mb-3">Assets / Income</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="py-2">Category</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeBreakdown.map((b) => (
                        <tr key={b._id} className="border-t">
                          <td className="py-2">{b._id}</td>
                          <td className="py-2 text-right font-medium">{formatXAF(b.total || 0)}</td>
                        </tr>
                      ))}
                      <tr className="border-t font-semibold">
                        <td className="py-2">Total Assets</td>
                        <td className="py-2 text-right">{formatXAF(data.assets || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-sm font-semibold mb-3">Liabilities / Expenses</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="py-2">Category</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseBreakdown.map((b) => (
                        <tr key={b._id} className="border-t">
                          <td className="py-2">{b._id}</td>
                          <td className="py-2 text-right font-medium">{formatXAF(b.total || 0)}</td>
                        </tr>
                      ))}
                      <tr className="border-t font-semibold">
                        <td className="py-2">Total Liabilities</td>
                        <td className="py-2 text-right">{formatXAF(data.liabilities || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Equity</div>
                  <div className="text-2xl font-semibold">{formatXAF(data.equity || 0)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Assets</div>
                  <div className="font-medium">{formatXAF(data.assets || 0)}</div>
                  <div className="text-sm text-gray-500">Liabilities</div>
                  <div className="font-medium">{formatXAF(data.liabilities || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-2 border rounded">Close</button>
          <button onClick={handleExport} disabled={exporting} className="px-3 py-2 bg-blue-600 text-white rounded">{exporting ? 'Exporting…' : 'Export'}</button>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
