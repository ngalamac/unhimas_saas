import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { useUI } from '../../context/UIContext';

const RegistrarDashboard: React.FC = () => {
  const { showToast } = useUI();
  const [stats, setStats] = useState<{ total: number; today: number; tuition: { paid: number; partial: number; pending: number; overdue: number } } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchClient.get('/api/students/stats/overview');
        if (res.ok) {
          const body = await res.json();
          const data = body.data || {};
          // Derive today count via trends endpoint (optional)
          let today = 0;
          try {
            const t = await fetchClient.get('/api/students/stats/trends');
            if (t.ok) {
              const tb = await t.json();
              const months = (tb.data?.months || []);
              today = months.length ? months[months.length - 1].newAdmissions : 0;
            }
          } catch {}
          setStats({ total: data.total || 0, today, tuition: data.tuition || { paid: 0, partial: 0, pending: 0, overdue: 0 } });
        }
      } catch (e: any) {
        showToast('Failed to load registrar stats', 'error');
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Dashboard</h1>
        <span className="text-sm text-gray-600">Admissions & Student Records</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Total Students</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{stats ? stats.total : '—'}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Today Registrations</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{stats ? stats.today : '—'}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Pending Tuition</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{stats ? stats.tuition?.pending || 0 : '—'}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a href="#/dashboard/student-registration" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Register Student</a>
          <a href="#/dashboard/departments" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Manage Departments</a>
        </div>
      </div>
    </div>
  );
};

export default RegistrarDashboard;
