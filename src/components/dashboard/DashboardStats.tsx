import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, Users2, UserCheck, Building2, QrCode, CreditCard, FileText } from 'lucide-react';
import { formatXAF } from '../../utils/currency';
import fetchClient from '../../lib/fetchClient';

export const DashboardStats: React.FC = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalStaff: 0,
        totalPrograms: 0,
        totalDepartments: 0,
        totalRevenue: 0,
        activeBranches: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [studentsRes, staffRes, programsRes, departmentsRes, summaryRes, branchesRes] = await Promise.all([
                    fetchClient.get('/api/students/stats/overview'),
                    fetchClient.get('/api/staff'),
                    fetchClient.get('/api/programs'),
                    fetchClient.get('/api/departments'),
                    fetchClient.get('/api/transactions/summary'),
                    fetchClient.get('/api/branches'),
                ]);

                const studentsData = await studentsRes.json();
                const staffData = await staffRes.json();
                const programsData = await programsRes.json();
                const departmentsData = await departmentsRes.json();
                const summaryData = await summaryRes.json();
                const branchesData = await branchesRes.json();

                setStats({
                    totalStudents: studentsData.data?.total || 0,
                    totalStaff: staffData.data?.length || 0,
                    totalPrograms: programsData.data?.length || 0,
                    totalDepartments: departmentsData.data?.length || 0,
                    totalRevenue: summaryData.data?.totalIncome || 0,
                    activeBranches: branchesData.data?.filter((b: any) => b.isActive).length || 0,
                });

            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <div>Loading stats...</div>;
    }

    const blueStats = [
        {
            title: 'Total Students',
            value: stats.totalStudents.toString(),
            subtitle: 'ACTIVE ENROLLMENT',
            color: 'bg-blue-600',
            icon: <GraduationCap className="w-8 h-8 text-white" />
        },
        {
            title: 'Faculty Members',
            value: stats.totalStaff.toString(),
            subtitle: 'TEACHING STAFF',
            color: 'bg-blue-600',
            icon: <UserCheck className="w-8 h-8 text-white" />
        },
        {
            title: 'Programs',
            value: stats.totalPrograms.toString(),
            subtitle: 'ACTIVE PROGRAMS',
            color: 'bg-blue-600',
            icon: <Building2 className="w-8 h-8 text-white" />
        },
        {
            title: 'Departments',
            value: stats.totalDepartments.toString(),
            subtitle: 'ACADEMIC DEPARTMENTS',
            color: 'bg-blue-600',
            icon: <Users2 className="w-8 h-8 text-white" />
        }
    ];

    const redStats = [
        {
            title: 'Fee Collections',
            value: formatXAF(stats.totalRevenue),
            subtitle: 'TOTAL REVENUE',
            color: 'bg-red-600',
            icon: <CreditCard className="w-8 h-8 text-white" />
        },
        {
            title: 'Active Branches',
            value: stats.activeBranches.toString(),
            subtitle: 'OPERATIONAL',
            color: 'bg-red-600',
            icon: <Building2 className="w-8 h-8 text-white" />
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {blueStats.map((stat, index) => (
                    <div key={index} className={`${stat.color} rounded-lg p-6 text-white`}>
                        <div className="flex items-center justify-between mb-4">
                            {stat.icon}
                            <div className="text-right">
                                <div className="text-3xl font-bold text-yellow-400">{stat.value}</div>
                                <div className="text-sm font-medium">{stat.title}</div>
                            </div>
                        </div>
                        <div className="text-xs font-medium opacity-90 border-t border-white/20 pt-2">
                            {stat.subtitle}
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {redStats.map((stat, index) => (
                    <div key={index} className={`${stat.color} rounded-lg p-6 text-white`}>
                        <div className="flex items-center justify-between mb-4">
                            {stat.icon}
                            <div className="text-right">
                                <div className="text-3xl font-bold text-yellow-400">{stat.value}</div>
                                <div className="text-sm font-medium">{stat.title}</div>
                            </div>
                        </div>
                        <div className="text-xs font-medium opacity-90 border-t border-white/20 pt-2">
                            {stat.subtitle}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};