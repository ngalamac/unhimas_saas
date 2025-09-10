import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { useAuth } from '../../context/AuthContext';
import { Users, BookOpen, Star, Plus } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

interface HODStats {
    studentCount: number;
    courseCount: number;
    specialtyCount: number;
}

export const HODDashboard: React.FC = () => {
    const [stats, setStats] = useState<HODStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { setCurrentPage } = useNavigation();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetchClient.get('/api/dashboard/hod');
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
    }, [user]);

    if (loading) {
        return <div className="p-6 text-center">Loading HOD Dashboard...</div>;
    }

    if (!stats) {
        return <div className="p-6 text-center text-red-500">Error loading dashboard data.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Head of Department Dashboard</h1>
                <p className="text-gray-600">Overview of your department's academic status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border"><Users className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Students</p><p className="text-3xl font-bold">{stats.studentCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><BookOpen className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Courses</p><p className="text-3xl font-bold">{stats.courseCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><Star className="w-6 h-6 text-yellow-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Specialties</p><p className="text-3xl font-bold">{stats.specialtyCount}</p></div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setCurrentPage('all-students')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <Users className="w-4 h-4" />
                        <span>Manage Students</span>
                    </button>
                     <button
                        onClick={() => setCurrentPage('courses')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Manage Courses</span>
                    </button>
                    <button
                        onClick={() => setCurrentPage('enter-grades')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Enter Grades</span>
                    </button>
                </div>
            </div>
        </div>
    );
};