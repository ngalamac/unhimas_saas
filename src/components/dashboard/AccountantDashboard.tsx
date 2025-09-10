import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { useBranch } from '../../context/BranchContext';
import { DollarSign, ArrowUpRight, ArrowDownRight, BarChart3, Plus, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigation } from '../../context/NavigationContext';

interface AccountantStats {
    totalIncome: number;
    totalExpenses: number;
    recentTransactions: any[];
}

export const AccountantDashboard: React.FC = () => {
    const [stats, setStats] = useState<AccountantStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { currentBranch } = useBranch();
    const { setCurrentPage } = useNavigation();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetchClient.get('/api/dashboard/accountant');
                if (!response.ok) throw new Error('Failed to fetch dashboard data');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [currentBranch]);

    if (loading) {
        return <div className="p-6 text-center">Loading Accountant Dashboard...</div>;
    }

    if (!stats) {
        return <div className="p-6 text-center text-red-500">Error loading dashboard data.</div>;
    }

    const financialChartData = [
        { name: 'Financials', income: stats.totalIncome, expenses: stats.totalExpenses, net: stats.totalIncome - stats.totalExpenses }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h1>
                <p className="text-gray-600">Financial overview for {currentBranch?.name || 'your branch'}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border"><ArrowUpRight className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Income</p><p className="text-3xl font-bold">{stats.totalIncome.toLocaleString()} XAF</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><ArrowDownRight className="w-6 h-6 text-red-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Expenses</p><p className="text-3xl font-bold">{stats.totalExpenses.toLocaleString()} XAF</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><DollarSign className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Net Profit</p><p className="text-3xl font-bold">{(stats.totalIncome - stats.totalExpenses).toLocaleString()} XAF</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stats.recentTransactions.map(tx => (
                                    <tr key={tx._id}>
                                        <td className="px-4 py-3 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-medium">{tx.description}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount.toLocaleString()} XAF
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setCurrentPage('transactions')}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Transaction</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage('income-vs-expenses')}
                            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>View Reports</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage('payment-plans')}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Manage Payment Plans</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};