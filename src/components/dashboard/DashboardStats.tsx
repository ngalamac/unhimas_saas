import React from 'react';
import { Users, GraduationCap, Users2, UserCheck, Building2, QrCode, CreditCard, FileText } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const stats = [
    {
      title: 'Total Students',
      value: '1,247',
      subtitle: 'ACTIVE ENROLLMENT',
      color: 'bg-blue-600',
      icon: <GraduationCap className="w-8 h-8 text-white" />
    },
    {
      title: 'Faculty Members',
      value: '89',
      subtitle: 'TEACHING STAFF',
      color: 'bg-blue-600',
      icon: <UserCheck className="w-8 h-8 text-white" />
    },
    {
      title: 'Programs',
      value: '12',
      subtitle: 'ACTIVE PROGRAMS',
      color: 'bg-blue-600',
      icon: <Building2 className="w-8 h-8 text-white" />
    },
    {
      title: 'Departments',
      value: '8',
      subtitle: 'ACADEMIC DEPARTMENTS',
      color: 'bg-blue-600',
      icon: <Users2 className="w-8 h-8 text-white" />
    }
  ];

  const redStats = [
    {
      title: 'Pending Admissions',
      value: '23',
      subtitle: 'AWAITING APPROVAL',
      color: 'bg-red-600',
      icon: <FileText className="w-8 h-8 text-white" />
    },
    {
      title: 'Fee Collections',
      value: '2.4M CFA',
      subtitle: 'THIS MONTH',
      color: 'bg-red-600',
      icon: <CreditCard className="w-8 h-8 text-white" />
    },
    {
      title: 'QR Attendance',
      value: '94%',
      subtitle: 'TODAY\'S RATE',
      color: 'bg-red-600',
      icon: <QrCode className="w-8 h-8 text-white" />
    },
    {
      title: 'Active Branches',
      value: '3',
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