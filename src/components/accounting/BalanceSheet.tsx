import React, { useEffect, useState } from 'react';
import { X, Download, Calendar, Filter, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 p-6 pb-0">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Balance Sheet</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onClose} 
              className="p-6 pb-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  value={from} 
                  onChange={e => setFrom(e.target.value)} 
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  value={to} 
                  onChange={e => setTo(e.target.value)} 
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value as any)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div className="flex items-center space-x-3 mb-6">
            <button 
              onClick={fetchReport} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
            <button 
              onClick={() => { setFrom(''); setTo(''); fetchReport(); }} 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {loading && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Generating balance sheet...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {data && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Assets/Income Section */}
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h4 className="text-lg font-semibold text-green-800">Assets / Income</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-600 border-b border-green-200">
                        <th className="py-3">Category</th>
                        <th className="py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeBreakdown.map((b) => (
                        <tr key={b._id} className="border-b border-green-100">
                          <td className="py-3 font-medium text-gray-900">{b._id}</td>
                          <td className="py-3 text-right font-semibold text-green-700">
                            {formatXAF(b.total || 0)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-green-300 font-bold">
                        <td className="py-3 text-green-800">Total Assets</td>
                        <td className="py-3 text-right text-green-800">
                          {formatXAF(data.assets || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Liabilities/Expenses Section */}
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                  <h4 className="text-lg font-semibold text-red-800">Liabilities / Expenses</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-600 border-b border-red-200">
                        <th className="py-3">Category</th>
                        <th className="py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseBreakdown.map((b) => (
                        <tr key={b._id} className="border-b border-red-100">
                          <td className="py-3 font-medium text-gray-900">{b._id}</td>
                          <td className="py-3 text-right font-semibold text-red-700">
                            {formatXAF(b.total || 0)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-red-300 font-bold">
                        <td className="py-3 text-red-800">Total Liabilities</td>
                        <td className="py-3 text-right text-red-800">
                          {formatXAF(data.liabilities || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Equity Summary */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800">Net Equity</h4>
                    <p className="text-sm text-blue-600">Assets - Liabilities</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${
                    (data.equity || 0) >= 0 ? 'text-blue-700' : 'text-red-700'
                  }`}>
                    {formatXAF(data.equity || 0)}
                  </p>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>Assets: {formatXAF(data.assets || 0)}</div>
                    <div>Liabilities: {formatXAF(data.liabilities || 0)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="px-6 pb-6">
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="flex items-center space-x-4">
                {['pdf', 'excel', 'csv', 'email'].map((format) => (
                  <label key={format} className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="format" 
                      value={format} 
                      checked={exportFormat === format} 
                      onChange={() => setExportFormat(format as any)} 
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            {exportFormat === 'email' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={exportEmail} 
                  onChange={e => setExportEmail(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="recipient@example.com" 
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button 
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={handleExport} 
                disabled={exporting} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Exporting…' : 'Export'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;