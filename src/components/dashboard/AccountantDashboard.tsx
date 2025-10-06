import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, CreditCard, TrendingUp, AlertCircle, FileText, Users, Mail, MessageSquare } from 'lucide-react';
import { formatXAF } from '../../utils/currency';
import { getJournalEntries } from '../../api/transactions';
import { getStudents } from '../../api/students';
import { JournalEntry } from '../../types/accounting';
import { Student } from '../../types/school';
import fetchClient from '../../lib/fetchClient';
import { useBranch } from '../../context/BranchContext';

export const AccountantDashboard: React.FC = () => {
    const [summary, setSummary] = useState<{ totalIncome: number, totalExpense: number, net: number } | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<JournalEntry[]>([]);
    const [unpaidStudents, setUnpaidStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
    const [department, setDepartment] = useState<string>('');
    const [exporting, setExporting] = useState<null | 'csv' | 'xlsx' | 'pdf'>(null);
    const [trendBuckets, setTrendBuckets] = useState<Array<{ label: string; income: number; expense: number; net: number }>>([]);
    const { currentBranch } = useBranch();

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const qs = new URLSearchParams();
                if (department) qs.set('department', department);
                if (currentBranch) qs.set('branch', (currentBranch as any)._id || (currentBranch as any).id);
                const [summaryRes, transactionsRes, studentsRes] = await Promise.all([
                    fetchClient.get(`/api/transactions/summary?${qs.toString()}`),
                    fetchClient.get(`/api/transactions?limit=5${currentBranch ? `&branch=${encodeURIComponent((currentBranch as any)._id || (currentBranch as any).id)}` : ''}`),
                    getStudents(undefined, 1, 5, { status: 'Overdue' })
                ]);

                if (summaryRes.ok) {
                    const body = await summaryRes.json();
                    setSummary(body.data || body.summary || body);
                }

                if (transactionsRes.ok) {
                    const transactionsData = await transactionsRes.json();
                    setRecentTransactions(transactionsData.data || []);
                }
                
                setUnpaidStudents(studentsRes.data || []);

                // trends
                qs.set('period', period);
                const trendRes = await fetchClient.get(`/api/transactions/summary/trends?${qs.toString()}`);
                if (trendRes.ok) {
                    const tb = await trendRes.json();
                    setTrendBuckets(tb?.data?.buckets || []);
                }

            } catch (error) {
                console.error("Failed to fetch accountant dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [period, department]);

    const incomePolyline = useMemo(() => {
      if (!trendBuckets.length) return '';
      const maxVal = Math.max(...trendBuckets.map(b => Math.max(b.income, b.expense, Math.abs(b.net))), 1);
      const chartWidth = 380; const chartHeight = 80; const left = 30; const bottom = 110;
      const step = chartWidth / (trendBuckets.length - 1 || 1);
      return trendBuckets.map((b, i) => {
        const x = left + i * step;
        const y = bottom - (b.income / maxVal) * chartHeight;
        return `${x} ${y}`;
      }).join(' ');
    }, [trendBuckets]);

    const expensePolyline = useMemo(() => {
      if (!trendBuckets.length) return '';
      const maxVal = Math.max(...trendBuckets.map(b => Math.max(b.income, b.expense, Math.abs(b.net))), 1);
      const chartWidth = 380; const chartHeight = 80; const left = 30; const bottom = 110;
      const step = chartWidth / (trendBuckets.length - 1 || 1);
      return trendBuckets.map((b, i) => {
        const x = left + i * step;
        const y = bottom - (b.expense / maxVal) * chartHeight;
        return `${x} ${y}`;
      }).join(' ');
    }, [trendBuckets]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h1>
                    <p className="text-gray-600">Financial management and fee tracking</p>
                </div>
                <div className="flex items-center gap-3">
                  <select value={period} onChange={e=>setPeriod(e.target.value as any)} className="px-3 py-2 border rounded">
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                  <input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Department ID (optional)" className="px-3 py-2 border rounded" />
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
                            <p className="text-sm text-gray-600">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900">{formatXAF(summary?.totalIncome || 0)}</p>
                        </div>
                    </div>
                    {/* Sparkline */}
                    <div className="mt-4">
                      <svg className="w-full h-28" viewBox="0 0 420 120">
                        <defs>
                          <pattern id="grid-a" width="40" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-a)" />
                        {trendBuckets.length > 1 && (
                          <polyline fill="none" stroke="#16a34a" strokeWidth="3" points={incomePolyline} />
                        )}
                        {trendBuckets.map((b, i) => (
                          <text key={b.label + i} x={40 + i * (380 / (trendBuckets.length - 1 || 1))} y={115} textAnchor="middle" className="fill-gray-400 text-[10px]">{b.label}</text>
                        ))}
                      </svg>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Expense</p>
                            <p className="text-2xl font-bold text-gray-900">{formatXAF(summary?.totalExpense || 0)}</p>
                        </div>
                    </div>
                    {/* Sparkline */}
                    <div className="mt-4">
                      <svg className="w-full h-28" viewBox="0 0 420 120">
                        <rect width="100%" height="100%" fill="url(#grid-a)" />
                        {trendBuckets.length > 1 && (
                          <polyline fill="none" stroke="#dc2626" strokeWidth="3" points={expensePolyline} />
                        )}
                        {trendBuckets.map((b, i) => (
                          <text key={b.label + i} x={40 + i * (380 / (trendBuckets.length - 1 || 1))} y={115} textAnchor="middle" className="fill-gray-400 text-[10px]">{b.label}</text>
                        ))}
                      </svg>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Net Profit</p>
                            <p className="text-2xl font-bold text-gray-900">{formatXAF(summary?.net || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Unpaid Students</p>
                            <p className="text-2xl font-bold text-gray-900">{unpaidStudents.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Transactions */}
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
                    <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                      onClick={async () => {
                        try {
                          const overdue = unpaidStudents.slice(0, 25); // limit batch
                          await Promise.all(overdue.map(async (s) => {
                            await fetchClient.post('/api/communication/email', {
                              to: s.email,
                              subject: 'Tuition Payment Reminder',
                              text: `Dear ${s.firstName},\n\nOur records show an outstanding tuition balance of ${formatXAF(s.balanceDue)}. Please make payment at your earliest convenience.\n\nThank you.`,
                            });
                          }));
                          alert('Payment reminders queued for selected students');
                        } catch (e) {
                          alert('Failed to send reminders');
                        }
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Payment Reminders</span>
                    </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                      <div className="flex items-center gap-2">
                        <button disabled={exporting!==null} onClick={async ()=>{
                          try {
                            setExporting('csv');
                            // simple export of summary bucket by period using trends
                            const qs = new URLSearchParams();
                            if (department) qs.set('department', department);
                            if (currentBranch) qs.set('branch', (currentBranch as any)._id || (currentBranch as any).id);
                            qs.set('period', period);
                            const res = await fetchClient.get(`/api/transactions/summary/trends?${qs.toString()}`);
                            if (!res.ok) { alert('Export failed'); setExporting(null); return; }
                            const data = await res.json();
                            const rows = (data?.data?.buckets || []).map((b: any) => ({ label: b.label, income: b.income, expense: b.expense, net: b.net }));
                            const header = 'Label,Income,Expense,Net\n';
                            const csv = header + rows.map((r: any)=>`${r.label},${r.income},${r.expense},${r.net}`).join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = 'finance_trends.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                          } finally { setExporting(null); }
                        }} className={`px-3 py-1 rounded border text-sm ${exporting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100'}`}>CSV</button>
                        <button disabled className="px-3 py-1 rounded border text-sm opacity-50 cursor-not-allowed" title="XLSX export coming soon">Excel</button>
                        <button disabled className="px-3 py-1 rounded border text-sm opacity-50 cursor-not-allowed" title="PDF export coming soon">PDF</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                        {recentTransactions.map((entry) => (
                            <div key={entry._id} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium">{entry.memo}</p>
                                    <p className="text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {entry.status}
                                </span>
                            </div>
                        ))}
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
                            {unpaidStudents.map((student) => (
                                <tr key={student._id}>
                                    <td className="px-4 py-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                                            <p className="text-sm text-gray-500">{student.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                        {typeof student.program === 'string' ? student.program : (student.program as any)?.name} - Level {student.level}
                                    </td>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                        {formatXAF(student.balanceDue)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                            {student.tuitionStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <button className="text-blue-600 hover:text-blue-900 text-sm" onClick={async () => {
                                          try {
                                            await fetchClient.post('/api/communication/email', {
                                              to: student.email,
                                              subject: 'Tuition Payment Reminder',
                                              text: `Dear ${student.firstName},\n\nOur records show an outstanding tuition balance of ${formatXAF(student.balanceDue)}. Please make payment at your earliest convenience.\n\nThank you.`,
                                            });
                                            alert('Reminder queued');
                                          } catch (e) { alert('Failed to send'); }
                                        }}>
                                            Send Reminder
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};