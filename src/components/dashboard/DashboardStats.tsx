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
                    fetchClient.get('/api/accounting/summary'),
                    fetchClient.get('/api/branches'),
                ]);

                const studentsData = studentsRes.ok ? await studentsRes.json() : { data: null };
                const staffData = staffRes.ok ? await staffRes.json() : { data: [] };
                const programsData = programsRes.ok ? await programsRes.json() : { data: [] };
                const departmentsData = departmentsRes.ok ? await departmentsRes.json() : { data: [] };
                const summaryData = summaryRes.ok ? await summaryRes.json() : { data: null };
                const branchesData = branchesRes.ok ? await branchesRes.json() : { data: [] };

                setStats({
                    totalStudents: studentsData.data?.total || studentsData.total || 0,
                    totalStaff: Array.isArray(staffData.data) ? staffData.data.length : (Array.isArray(staffData) ? staffData.length : 0),
                    totalPrograms: Array.isArray(programsData.data) ? programsData.data.length : (Array.isArray(programsData) ? programsData.length : 0),
                    totalDepartments: Array.isArray(departmentsData.data) ? departmentsData.data.length : (Array.isArray(departmentsData) ? departmentsData.length : 0),
                    totalRevenue: summaryData.summary?.totalIncome || summaryData.data?.totalIncome || summaryData.totalIncome || 0,
                    activeBranches: Array.isArray(branchesData.data) ? branchesData.data.filter((b: any) => b.isActive).length : (Array.isArray(branchesData) ? branchesData.filter((b: any) => b.isActive).length : 0),
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
            title: 'Active Branches',
            value: stats.activeBranches.toString(),
            subtitle: 'OPERATIONAL',
            color: 'bg-red-600',
            icon: <Building2 className="w-8 h-8 text-white" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {blueStats.map((stat, index) => (
                    <div
                        key={index}
                        className="group relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12"></div>

                        <div className="relative flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                {stat.icon}
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-white drop-shadow-lg">{stat.value}</div>
                                <div className="text-sm font-semibold mt-1 opacity-90">{stat.title}</div>
                            </div>
                        </div>
                        <div className="relative text-xs font-medium opacity-90 border-t border-white/20 pt-3 mt-3">
                            {stat.subtitle}
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {redStats.map((stat, index) => (
                    <div
                        key={index}
                        className="group relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12"></div>

                        <div className="relative flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                {stat.icon}
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-white drop-shadow-lg">{stat.value}</div>
                                <div className="text-sm font-semibold mt-1 opacity-90">{stat.title}</div>
                            </div>
                        </div>
                        <div className="relative text-xs font-medium opacity-90 border-t border-white/20 pt-3 mt-3">
                            {stat.subtitle}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};