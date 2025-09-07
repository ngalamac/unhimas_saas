import React from 'react';
import { getCurrentBatchData } from '../../data/mockData';
import { mockStudents, mockBranches, mockPayments, mockEmployees, mockPrograms, mockDepartments } from '../../data/mockData';
import { Users, GraduationCap, Users2, UserCheck, Building2, QrCode, CreditCard, FileText } from 'lucide-react';
import { formatXAF } from '../../utils/currency';

export const DashboardStats: React.FC = () => {
  const currentBatch = getCurrentBatchData();
  const currentBatchStudents = mockStudents.filter(s => s.batch === currentBatch?.name);
  const activeBranches = mockBranches.filter(b => b.isActive);
  const totalRevenue = mockPayments
    .filter(p => p.status === 'Completed' && p.batch === currentBatch?.name)
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAdmissions = 23; // Mock data
  const attendanceRate = 94; // Mock data

  const formatCurrency = (amount: number) => formatXAF(amount);

  const stats = [
    {
      title: 'Total Students',
      value: currentBatchStudents.length.toString(),
      subtitle: `ACTIVE ENROLLMENT (${currentBatch?.name})`,
      color: 'bg-blue-600',
      icon: <GraduationCap className="w-8 h-8 text-white" />
    },
    {
      title: 'Faculty Members',
      value: mockEmployees.filter(e => e.isActive).length.toString(),
      subtitle: 'TEACHING STAFF',
      color: 'bg-blue-600',
      icon: <UserCheck className="w-8 h-8 text-white" />
    },
    {
      title: 'Programs',
      value: mockPrograms.filter(p => p.isActive).length.toString(),
      subtitle: 'ACTIVE PROGRAMS',
      color: 'bg-blue-600',
      icon: <Building2 className="w-8 h-8 text-white" />
    },
    {
      title: 'Departments',
  value: mockDepartments.filter((d: any) => d.isActive).length.toString(),
      subtitle: 'ACADEMIC DEPARTMENTS',
      color: 'bg-blue-600',
      icon: <Users2 className="w-8 h-8 text-white" />
    }
  ];

  const redStats = [
    {
      title: 'Pending Admissions',
      value: pendingAdmissions.toString(),
      subtitle: 'AWAITING APPROVAL',
      color: 'bg-red-600',
      icon: <FileText className="w-8 h-8 text-white" />
    },
    {
      title: 'Fee Collections',
      value: formatCurrency(totalRevenue),
      subtitle: `THIS BATCH (${currentBatch?.name})`,
      color: 'bg-red-600',
      icon: <CreditCard className="w-8 h-8 text-white" />
    },
    {
      title: 'QR Attendance',
      value: `${attendanceRate}%`,
      subtitle: "TODAY'S RATE",
      color: 'bg-red-600',
      icon: <QrCode className="w-8 h-8 text-white" />
    },
    {
      title: 'Active Branches',
      value: activeBranches.length.toString(),
      subtitle: 'OPERATIONAL',
      color: 'bg-red-600',
      icon: <Building2 className="w-8 h-8 text-white" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Blue Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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

      {/* Red Stats Row */}
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