import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { useBranch } from '../../context/BranchContext';
import { GraduationCap, Building2, Star, BookOpen, Plus } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

interface DeanStats {
    programCount: number;
    departmentCount: number;
    specialtyCount: number;
    courseCount: number;
}

export const DeanDashboard: React.FC = () => {
    const [stats, setStats] = useState<DeanStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { currentBranch } = useBranch();
    const { setCurrentPage } = useNavigation();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetchClient.get('/api/dashboard/dean');
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
        return <div className="p-6 text-center">Loading Dean of Studies Dashboard...</div>;
    }

    if (!stats) {
        return <div className="p-6 text-center text-red-500">Error loading dashboard data.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dean of Studies Dashboard</h1>
                <p className="text-gray-600">Academic overview for {currentBranch?.name || 'your branch'}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border"><GraduationCap className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Programs</p><p className="text-3xl font-bold">{stats.programCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><Building2 className="w-6 h-6 text-purple-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Departments</p><p className="text-3xl font-bold">{stats.departmentCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><Star className="w-6 h-6 text-yellow-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Specialties</p><p className="text-3xl font-bold">{stats.specialtyCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border"><BookOpen className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-sm text-gray-600">Total Courses</p><p className="text-3xl font-bold">{stats.courseCount}</p></div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setCurrentPage('programs')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <GraduationCap className="w-4 h-4" />
                        <span>Manage Programs</span>
                    </button>
                     <button
                        onClick={() => setCurrentPage('departments')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                    >
                        <Building2 className="w-4 h-4" />
                        <span>Manage Departments</span>
                    </button>
                    <button
                        onClick={() => setCurrentPage('specialties')}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                    >
                        <Star className="w-4 h-4" />
                        <span>Manage Specialties</span>
                    </button>
                    <button
                        onClick={() => setCurrentPage('courses')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Manage Courses</span>
                    </button>
                </div>
            </div>
        </div>
    );
};