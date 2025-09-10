import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { useBranch } from '../../context/BranchContext';
import { Users, UserPlus, BarChart3, Plus, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigation } from '../../context/NavigationContext';

interface RegistrarStats {
    totalStudents: number;
    newAdmissions: number;
    studentsByProgram: Array<{ programName: string; count: number }>;
    recentStudents: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export const RegistrarDashboard: React.FC = () => {
    const [stats, setStats] = useState<RegistrarStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { currentBranch } = useBranch();
    const { setCurrentPage } = useNavigation();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetchClient.get('/api/dashboard/registrar');
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
        return <div className="p-6 text-center">Loading Registrar Dashboard...</div>;
    }

    if (!stats) {
        return <div className="p-6 text-center text-red-500">Error loading dashboard data.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Registrar Dashboard</h1>
                <p className="text-gray-600">Student enrollment and records for {currentBranch?.name || 'your branch'}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border"><Users className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Active Students</p><p className="text-3xl font-bold">{stats.totalStudents}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><UserPlus className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-sm text-gray-600">New Admissions (Last 30 Days)</p><p className="text-3xl font-bold">{stats.newAdmissions}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4">Recently Registered Students</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Admission Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stats.recentStudents.map(student => (
                                    <tr key={student._id}>
                                        <td className="px-4 py-3 font-medium">{student.firstName} {student.lastName}</td>
                                        <td className="px-4 py-3 text-sm">{student.program?.name}</td>
                                        <td className="px-4 py-3 text-sm">{new Date(student.admissionDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Students by Program</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={stats.studentsByProgram}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="programName"
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                                {stats.studentsByProgram.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setCurrentPage('student-registration')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Register Student</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage('all-students')}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
                        >
                            <Users className="w-4 h-4" />
                            <span>View All Students</span>
                        </button>
                    </div>
                </div>
        </div>
    );
};
