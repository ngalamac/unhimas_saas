import React, { useState } from 'react';
import { fetchIncomeStatement, fetchExpenseStatement, fetchBalanceSheet } from '../../api/accounting';
import { formatXAF } from '../../utils/currency';
import { Loader, AlertCircle } from 'lucide-react';

type ReportData = {
    total: number;
    breakdown: Array<{ _id: string; total: number; count: number }>;
} | {
    assets: number;
    liabilities: number;
    equity: number;
};

const ReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'balance'>('income');
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setData(null);
        try {
            let reportData;
            const params = { from: dateRange.from, to: dateRange.to };
            if (activeTab === 'income') {
                reportData = await fetchIncomeStatement(params);
            } else if (activeTab === 'expense') {
                reportData = await fetchExpenseStatement(params);
            } else {
                reportData = await fetchBalanceSheet(params);
            }
            setData(reportData);
        } catch (err: any) {
            setError(err.message || `Failed to generate ${activeTab} report`);
        } finally {
            setLoading(false);
        }
    };

    const renderReport = () => {
        if (loading) {
            return <div className="text-center py-8"><Loader className="animate-spin inline-block" /></div>;
        }
        if (error) {
            return (
                <div className="flex items-center p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    <AlertCircle className="mr-2" />
                    {error}
                </div>
            );
        }
        if (!data) {
            return <p className="text-center text-gray-500 py-8">Generate a report to see the data.</p>;
        }

        if ('total' in data) { // Income or Expense Statement
            return (
                <div>
                    <h3 className="text-2xl font-bold text-center mb-4">{activeTab === 'income' ? 'Income' : 'Expense'} Statement</h3>
                    <div className="text-center mb-6">
                        <p className="text-gray-600">Total {activeTab === 'income' ? 'Income' : 'Expenses'}</p>
                        <p className="text-4xl font-bold text-gray-800">{formatXAF(data.total)}</p>
                    </div>
                    <h4 className="font-bold mb-2">Breakdown by Category</h4>
                    <ul className="space-y-2">
                        {data.breakdown.map(item => (
                            <li key={item._id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span>{item._id}</span>
                                <span className="font-medium">{formatXAF(item.total)} ({item.count} txns)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        if ('assets' in data) { // Balance Sheet
            return (
                <div>
                    <h3 className="text-2xl font-bold text-center mb-4">Balance Sheet</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between p-4 bg-green-100 rounded-lg">
                            <span className="font-bold text-green-800">Assets</span>
                            <span className="font-bold text-green-800">{formatXAF(data.assets)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-red-100 rounded-lg">
                            <span className="font-bold text-red-800">Liabilities</span>
                            <span className="font-bold text-red-800">{formatXAF(data.liabilities)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-blue-100 rounded-lg">
                            <span className="font-bold text-blue-800">Equity</span>
                            <span className="font-bold text-blue-800">{formatXAF(data.equity)}</span>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Financial Reports</h2>
            <div className="flex space-x-4 border-b mb-4">
                <button onClick={() => setActiveTab('income')} className={`py-2 px-4 ${activeTab === 'income' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Income Statement</button>
                <button onClick={() => setActiveTab('expense')} className={`py-2 px-4 ${activeTab === 'expense' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Expense Statement</button>
                <button onClick={() => setActiveTab('balance')} className={`py-2 px-4 ${activeTab === 'balance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Balance Sheet</button>
            </div>
            <div className="flex items-center space-x-4 mb-4">
                <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} className="px-3 py-2 border rounded-md" />
                <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} className="px-3 py-2 border rounded-md" />
                <button onClick={handleGenerateReport} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>
            <div className="mt-6">
                {renderReport()}
            </div>
        </div>
    );
};

export default ReportsPage;
