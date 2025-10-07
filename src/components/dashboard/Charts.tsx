import React, { useEffect, useMemo, useState } from 'react';
import { fetchAccountingSummary } from '../../api/accounting';
import { fetchAccountingTrends, fetchEnrollmentTrends, EnrollmentTrendPoint, AccountingTrendPoint } from '../../api/dashboard';

// Lightweight inline SVG charting without adding heavy dependencies.

export const Charts: React.FC = () => {
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; net: number } | null>(null);
  const [acctTrends, setAcctTrends] = useState<AccountingTrendPoint[]>([]);
  const [enrollTrends, setEnrollTrends] = useState<EnrollmentTrendPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [sum, at, et] = await Promise.all([
          fetchAccountingSummary().catch(() => null),
            fetchAccountingTrends().catch(() => []),
            fetchEnrollmentTrends().catch(() => [])
        ]);
        if (cancelled) return;
        if (sum) setSummary(sum);
        setAcctTrends(at);
        setEnrollTrends(et);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load charts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Donut chart calculations
  const donut = useMemo(() => {
    const income = summary?.totalIncome || 0;
    const expense = summary?.totalExpense || 0;
    const total = income + expense || 1; // avoid divide by zero
    const incomePct = income / total;
    const expensePct = expense / total;
    const circumference = 2 * Math.PI * 40; // r=40
    return {
      incomeStroke: `${incomePct * circumference} ${circumference}`,
      expenseStroke: `${expensePct * circumference} ${circumference}`,
      income, expense
    };
  }, [summary]);

  // Build enrollment polyline points
  const enrollmentPolylines = useMemo(() => {
    if (!enrollTrends.length) return { newPts: '', totalPts: '', max: 0 };
    const maxVal = Math.max(
      ...enrollTrends.map(p => Math.max(p.newAdmissions, p.totalEnrolled))
    ) || 1;
    const chartWidth = 360; // x from 40 -> 400-?; we maintain left padding 40
    const chartHeight = 140; // y range (invert since svg 0 at top)
    const left = 40; const bottom = 180; // consistent with original viewBox
    const step = chartWidth / (enrollTrends.length - 1 || 1);
    const newPts = enrollTrends.map((p, i) => {
      const x = left + i * step;
      const y = bottom - (p.newAdmissions / maxVal) * chartHeight;
      return `${x} ${y}`;
    }).join(' ');
    const totalPts = enrollTrends.map((p, i) => {
      const x = left + i * step;
      const y = bottom - (p.totalEnrolled / maxVal) * chartHeight;
      return `${x} ${y}`;
    }).join(' ');
    return { newPts, totalPts, max: maxVal };
  }, [enrollTrends]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Fee Collection vs Expenses</h3>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Last 6 Months</span>
        </div>
        {error && <div className="text-sm text-red-600 dark:text-red-400 mb-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}
        <div className="flex items-center justify-center h-64">
          <div className="relative w-48 h-48 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray={donut.incomeStroke} strokeLinecap="round" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray={donut.expenseStroke} strokeDashoffset={`-${donut.incomeStroke.split(' ')[0]}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-full flex flex-col items-center justify-center shadow-lg">
                <span className="text-[10px] text-gray-400 font-medium">NET</span>
                <span className="text-white font-bold text-sm">{(summary?.net || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-6 flex-wrap">
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Income</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">({(donut.income || 0).toLocaleString()})</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expense</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">({(donut.expense || 0).toLocaleString()})</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Student Enrollment Trends</h3>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Last 6 Months</span>
        </div>
        <div className="h-64">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* X-axis labels from data */}
            {enrollTrends.map((p, i) => (
              <text key={p.month} x={60 + i * (360 / (enrollTrends.length - 1 || 1))} y={195} className="text-[10px] fill-gray-500" textAnchor="middle">{p.label}</text>
            ))}
            {/* Polylines */}
            {enrollTrends.length > 1 && (
              <>
                <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={enrollmentPolylines.newPts} />
                <polyline fill="none" stroke="#10b981" strokeWidth="3" points={enrollmentPolylines.totalPts} />
              </>
            )}
            {/* Empty state */}
            {!loading && enrollTrends.length === 0 && (
              <text x="200" y="100" textAnchor="middle" className="fill-gray-400 text-sm">No data</text>
            )}
          </svg>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-6">
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Admissions</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Enrolled</span>
          </div>
        </div>
      </div>
    </div>
  );
};