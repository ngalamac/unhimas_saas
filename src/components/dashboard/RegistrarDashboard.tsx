import React, { useEffect, useMemo, useState } from 'react';
import fetchClient from '../../lib/fetchClient';
import { useUI } from '../../context/UIContext';

const RegistrarDashboard: React.FC = () => {
  const { showToast } = useUI();
  const [stats, setStats] = useState<{ total: number; today: number; tuition: { paid: number; partial: number; pending: number; overdue: number } } | null>(null);
  const [trend, setTrend] = useState<Array<{ label: string; newAdmissions: number; totalEnrolled: number }>>([]);

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
              setTrend(months);
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

  const enrollmentPolyline = useMemo(() => {
    if (!trend.length) return '';
    const maxVal = Math.max(...trend.map(p => Math.max(p.newAdmissions, p.totalEnrolled))) || 1;
    const chartWidth = 360; const chartHeight = 100; const left = 40; const bottom = 140;
    const step = chartWidth / (trend.length - 1 || 1);
    return trend.map((p, i) => {
      const x = left + i * step;
      const y = bottom - (p.newAdmissions / maxVal) * chartHeight;
      return `${x} ${y}`;
    }).join(' ');
  }, [trend]);

  const tuitionDonut = useMemo(() => {
    const paid = stats?.tuition?.paid || 0;
    const partial = stats?.tuition?.partial || 0;
    const pending = stats?.tuition?.pending || 0;
    const overdue = stats?.tuition?.overdue || 0;
    const total = Math.max(1, paid + partial + pending + overdue);
    const radius = 40; const circumference = 2 * Math.PI * radius;
    const seg = (n: number) => (n / total) * circumference;
    const paidLen = seg(paid);
    const partialLen = seg(partial);
    const pendingLen = seg(pending);
    const overdueLen = seg(overdue);
    return { radius, circumference, paidLen, partialLen, pendingLen, overdueLen };
  }, [stats]);

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

      {/* Tuition status distribution */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tuition Status Distribution</h3>
        {stats ? (
          <div>
            {(() => {
              const paid = stats.tuition?.paid || 0;
              const partial = stats.tuition?.partial || 0;
              const pending = stats.tuition?.pending || 0;
              const overdue = stats.tuition?.overdue || 0;
              const total = Math.max(1, paid + partial + pending + overdue);
              const pct = (n: number) => Math.round((n / total) * 100);
              return (
                <>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500" style={{ width: `${pct(paid)}%` }} title={`Paid ${pct(paid)}%`} />
                    <div className="h-full bg-yellow-500" style={{ width: `${pct(partial)}%` }} title={`Partial ${pct(partial)}%`} />
                    <div className="h-full bg-blue-500" style={{ width: `${pct(pending)}%` }} title={`Pending ${pct(pending)}%`} />
                    <div className="h-full bg-red-500" style={{ width: `${pct(overdue)}%` }} title={`Overdue ${pct(overdue)}%`} />
                  </div>
                  {/* Donut chart */}
                  <div className="mt-4 flex items-center space-x-8">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                      {/* order: paid (green), partial (yellow), pending (blue), overdue (red) */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12" strokeDasharray={`${tuitionDonut.paidLen} ${tuitionDonut.circumference}`} strokeLinecap="butt" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" strokeWidth="12" strokeDasharray={`${tuitionDonut.partialLen} ${tuitionDonut.circumference}`} strokeDashoffset={`-${tuitionDonut.paidLen}`} strokeLinecap="butt" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray={`${tuitionDonut.pendingLen} ${tuitionDonut.circumference}`} strokeDashoffset={`-${tuitionDonut.paidLen + tuitionDonut.partialLen}`} strokeLinecap="butt" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${tuitionDonut.overdueLen} ${tuitionDonut.circumference}`} strokeDashoffset={`-${tuitionDonut.paidLen + tuitionDonut.partialLen + tuitionDonut.pendingLen}`} strokeLinecap="butt" />
                    </svg>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-green-500 rounded-sm" /><span>Paid: {paid}</span></div>
                      <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-yellow-500 rounded-sm" /><span>Partial: {partial}</span></div>
                      <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-blue-500 rounded-sm" /><span>Pending: {pending}</span></div>
                      <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-red-500 rounded-sm" /><span>Overdue: {overdue}</span></div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-green-500 rounded-sm" /><span>Paid: {paid}</span></div>
                    <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-yellow-500 rounded-sm" /><span>Partial: {partial}</span></div>
                    <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-blue-500 rounded-sm" /><span>Pending: {pending}</span></div>
                    <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-red-500 rounded-sm" /><span>Overdue: {overdue}</span></div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading...</div>
        )}
      </div>

      {/* Enrollment trend sparkline */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Admissions Trend (6 months)</h3>
        <svg className="w-full h-40" viewBox="0 0 400 160">
          <defs>
            <pattern id="grid-light" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-light)" />
          {trend.length > 1 && (
            <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={enrollmentPolyline} />
          )}
          {trend.map((p, i) => (
            <text key={p.label + i} x={60 + i * (360 / (trend.length - 1 || 1))} y={155} className="text-[10px] fill-gray-500" textAnchor="middle">{p.label}</text>
          ))}
          {!trend.length && (
            <text x="200" y="80" textAnchor="middle" className="fill-gray-400 text-sm">No data</text>
          )}
        </svg>
      </div>
    </div>
  );
};

export default RegistrarDashboard;
