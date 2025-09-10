import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { useBranch } from '../../context/BranchContext';
import { Users, UserCheck, ArrowUpRight, ArrowDownRight, BarChart3, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigation } from '../../context/NavigationContext';

interface AdminStats {
    studentCount: number;
    staffCount: number;
    totalIncome: number;
    totalExpenses: number;
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { currentBranch } = useBranch();
    const { setCurrentPage } = useNavigation();

    useEffect(() => {
        const fetchStats = async () => {
            // This component should only render for an Admin, who is associated with a branch.
            // The API endpoint will use the logged-in user's branch.
            try {
                setLoading(true);
                const response = await fetchClient.get('/api/dashboard/admin');
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
    }, [currentBranch]); // Re-fetch if the branch context changes, just in case

    if (loading) {
        return <div className="p-6 text-center">Loading Branch Dashboard...</div>;
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
                <h1 className="text-2xl font-bold text-gray-900">Branch Dashboard</h1>
                <p className="text-gray-600">Overview of {currentBranch?.name || 'your branch'}'s performance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border"><Users className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Active Students</p><p className="text-3xl font-bold">{stats.studentCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><UserCheck className="w-6 h-6 text-teal-500 mb-2" />
                    <p className="text-sm text-gray-600">Active Staff</p><p className="text-3xl font-bold">{stats.staffCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><ArrowUpRight className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-sm text-gray-600">Branch Income</p><p className="text-3xl font-bold">{stats.totalIncome.toLocaleString()} XAF</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><ArrowDownRight className="w-6 h-6 text-red-500 mb-2" />
                    <p className="text-sm text-gray-600">Branch Expenses</p><p className="text-3xl font-bold">{stats.totalExpenses.toLocaleString()} XAF</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2" /> Branch Financial Summary</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={financialChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `${value.toLocaleString()} XAF`} />
                            <Legend />
                            <Bar dataKey="income" fill="#82ca9d" name="Income" />
                            <Bar dataKey="expenses" fill="#d06d81" name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setCurrentPage('student-registration')}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Register New Student</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage('enter-grades')}
                            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Enter Grades</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage('transactions')}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Transaction</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};