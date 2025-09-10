import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { Users, Building2, DollarSign, ArrowUpRight, ArrowDownRight, BarChart3, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SuperAdminStats {
    totalStudents: number;
    totalIncome: number;
    totalExpenses: number;
    totalBranches: number;
    totalUsers: number;
    branches: Array<{
        _id: string;
        name: string;
        studentCount: number;
        staffCount: number;
    }>;
}

export const SuperAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<SuperAdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetchClient.get('/api/dashboard/superadmin');
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
    }, []);

    if (loading) {
        return <div>Loading Super Admin Dashboard...</div>;
    }

    if (!stats) {
        return <div>Error loading dashboard data.</div>;
    }

    const financialChartData = [
        { name: 'Financials', income: stats.totalIncome, expenses: stats.totalExpenses, net: stats.totalIncome - stats.totalExpenses }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Overview</h1>
                <p className="text-gray-600">A global snapshot of the entire university system.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border"><Users className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Students</p><p className="text-3xl font-bold">{stats.totalStudents}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><Building2 className="w-6 h-6 text-purple-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Branches</p><p className="text-3xl font-bold">{stats.totalBranches}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><ArrowUpRight className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Income</p><p className="text-3xl font-bold">{stats.totalIncome.toLocaleString()} XAF</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><ArrowDownRight className="w-6 h-6 text-red-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Expenses</p><p className="text-3xl font-bold">{stats.totalExpenses.toLocaleString()} XAF</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><Building2 className="w-5 h-5 mr-2" /> Branch Summary</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Branch Name</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Students</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Staff</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stats.branches.map(branch => (
                                    <tr key={branch._id}>
                                        <td className="px-4 py-3 font-medium">{branch.name}</td>
                                        <td className="px-4 py-3 text-center">{branch.studentCount}</td>
                                        <td className="px-4 py-3 text-center">{branch.staffCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2" /> Financial Summary</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={financialChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="income" fill="#82ca9d" name="Income" />
                            <Bar dataKey="expenses" fill="#d06d81" name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};