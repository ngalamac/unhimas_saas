import React, { useEffect, useState } from 'react';
import { GraduationCap, Users, BookOpen, TrendingUp, Award, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';

export const DeanDashboard: React.FC = () => {
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [averageGPA, setAverageGPA] = useState(0);
  const [performance, setPerformance] = useState<Array<{ name: string; avgGpa: number; passRate: number }>>([]);
  const [programs, setPrograms] = useState<Array<{ _id: string; name: string; type?: string }>>([]);
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [detailed, setDetailed] = useState<{ name: string; breakdown: Array<{ letter: string; count: number; pct: number }> } | null>(null);
  const [exporting, setExporting] = useState<null | 'csv' | 'xlsx'>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [progRes, studRes, coursesRes] = await Promise.all([
          fetchClient.get('/api/programs'),
          fetchClient.get('/api/students/stats/overview'),
          fetchClient.get('/api/courses'),
        ]);
        const progs = progRes.ok ? await progRes.json() : [];
        const studs = studRes.ok ? await studRes.json() : {};
        const courses = coursesRes.ok ? await coursesRes.json() : [];
        const progArr = (Array.isArray(progs) ? progs : (progs.data || []));
        setPrograms(progArr);
        setTotalPrograms(progArr.filter((p: any) => p.isActive !== false).length);
        setTotalStudents(studs?.data?.total || studs?.total || 0);
        setTotalCourses((Array.isArray(courses) ? courses : (courses.data || [])).length);
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const res = await fetchClient.get('/api/grades/reports/program-performance');
        if (res.ok) {
          const body = await res.json();
          setPerformance(Array.isArray(body?.data) ? body.data.slice(0, 6) : []);
        }
      } catch {}
    };
    loadPerformance();
  }, []);

  useEffect(() => {
    const loadDetailed = async () => {
      if (!selectedProgram) { setDetailed(null); return; }
      try {
        const params = new URLSearchParams();
        if (filterFrom) params.append('from', filterFrom);
        if (filterTo) params.append('to', filterTo);
        params.append('program', selectedProgram);
        const res = await fetchClient.get(`/api/grades/reports/program-performance/detailed?${params.toString()}`);
        if (res.ok) {
          const body = await res.json();
          const item = Array.isArray(body?.data) ? body.data.find((d: any) => String(d.programId) === String(selectedProgram)) || body.data[0] : null;
          setDetailed(item ? { name: item.name, breakdown: item.breakdown || [] } : null);
        }
      } catch {}
    };
    loadDetailed();
  }, [selectedProgram, filterFrom, filterTo]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dean of Studies Dashboard</h1>
          <p className="text-gray-600">Academic oversight and program management</p>
          <p className="text-sm text-blue-600">Academic oversight and program management</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{new Date().toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Academic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Programs</p>
              <p className="text-2xl font-bold text-gray-900">{totalPrograms}</p>
              <p className="text-xs text-blue-600">Across all levels</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-xs text-green-600">All programs</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
              <p className="text-xs text-purple-600">This semester</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average GPA</p>
              <p className="text-2xl font-bold text-gray-900">{averageGPA.toFixed(2)}</p>
              <p className="text-xs text-orange-600">Institution wide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Program Mix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span>Create Program</span>
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Add Course</span>
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Academic Report</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Mix</h3>
          <div className="space-y-2">
            {totalPrograms > 0 ? (
              <>
                <div className="flex items-center space-x-3">
                  <span className="w-24 text-sm text-gray-600">Programs</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '100%' }} />
                  </div>
                  <span className="w-12 text-right text-sm text-gray-600">{totalPrograms}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-24 text-sm text-gray-600">Courses</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: '100%' }} />
                  </div>
                  <span className="w-12 text-right text-sm text-gray-600">{totalCourses}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No data</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Program Performance</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    setExporting('csv');
                    const params = new URLSearchParams();
                    if (selectedProgram) params.append('program', selectedProgram);
                    if (filterFrom) params.append('from', filterFrom);
                    if (filterTo) params.append('to', filterTo);
                    const res = await fetchClient.get(`/api/grades/reports/program-performance/export?format=csv&${params.toString()}`);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'program-performance.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {}
                  finally { setExporting(null); }
                }}
                disabled={exporting !== null}
                className={`px-3 py-1 rounded border text-sm ${exporting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                title="Export CSV"
              >{exporting === 'csv' ? 'Exporting…' : 'CSV'}</button>
              <button
                onClick={async () => {
                  try {
                    setExporting('xlsx');
                    const params = new URLSearchParams();
                    if (selectedProgram) params.append('program', selectedProgram);
                    if (filterFrom) params.append('from', filterFrom);
                    if (filterTo) params.append('to', filterTo);
                    const res = await fetchClient.get(`/api/grades/reports/program-performance/export?format=xlsx&${params.toString()}`);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'program-performance.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {}
                  finally { setExporting(null); }
                }}
                disabled={exporting !== null}
                className={`px-3 py-1 rounded border text-sm ${exporting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                title="Export Excel"
              >{exporting === 'xlsx' ? 'Exporting…' : 'Excel'}</button>
            </div>
          </div>
          {performance.length ? (
            <div className="space-y-3">
              {performance.map((p) => (
                <div key={p.name} className="grid grid-cols-5 gap-3 items-center text-sm">
                  <div className="col-span-2 font-medium text-gray-900 truncate">{p.name}</div>
                  <div className="col-span-1 text-gray-600">GPA {p.avgGpa.toFixed(2)}</div>
                  <div className="col-span-2">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600" style={{ width: `${Math.max(0, Math.min(100, p.passRate))}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Pass {p.passRate}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No performance data yet</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-medium">Academic Board Meeting</p>
                <p className="text-gray-500">Tomorrow, 10:00 AM</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium">Curriculum Review</p>
                <p className="text-gray-500">Next week</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Program Overview (placeholder; to be wired later) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockPrograms.map((program) => (
            <div key={program.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{program.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  program.type === 'HND' ? 'bg-blue-100 text-blue-800' :
                  program.type === 'Bachelor' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {program.type}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Duration: {program.duration} years</div>
                <div>Courses: {program.courses.length}</div>
                <div>Students: {mockStudents.filter(s => s.program.id === program.id).length}</div>
                <div>HOD: {program.hod ? `${program.hod.firstName} ${program.hod.lastName}` : 'Not assigned'}</div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                  View Details
                </button>
                <button className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                  Edit Program
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Performance Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Performance Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Program</label>
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select program</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">From</label>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">To</label>
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { /* state already bound triggers fetch */ }} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Apply</button>
          </div>
        </div>
        {/* Letter grade distribution */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Letter Grade Distribution {detailed?.name ? `— ${detailed.name}` : ''}</h4>
          {detailed?.breakdown?.length ? (
            <div className="space-y-2">
              {detailed.breakdown.map((b) => (
                <div key={b.letter} className="grid grid-cols-6 gap-3 items-center text-sm">
                  <div className="col-span-1 font-medium text-gray-900">{b.letter}</div>
                  <div className="col-span-4">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, b.pct))}%` }} />
                    </div>
                  </div>
                  <div className="col-span-1 text-right text-gray-600">{b.pct}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Select a program and optionally a date range to view distribution.</div>
          )}
        </div>
        {/* Export */}
        <div className="mt-6 flex gap-3">
          <a
            className="px-4 py-2 bg-gray-100 border rounded-lg text-sm hover:bg-gray-200"
            href={`/api/grades/reports/program-performance/export?format=csv${selectedProgram ? `&program=${encodeURIComponent(selectedProgram)}` : ''}${filterFrom ? `&from=${encodeURIComponent(filterFrom)}` : ''}${filterTo ? `&to=${encodeURIComponent(filterTo)}` : ''}`}
          >Export CSV</a>
          <a
            className="px-4 py-2 bg-gray-100 border rounded-lg text-sm hover:bg-gray-200"
            href={`/api/grades/reports/program-performance/export?format=xlsx${selectedProgram ? `&program=${encodeURIComponent(selectedProgram)}` : ''}${filterFrom ? `&from=${encodeURIComponent(filterFrom)}` : ''}${filterTo ? `&to=${encodeURIComponent(filterTo)}` : ''}`}
          >Export Excel</a>
        </div>
      </div>
    </>
  );
};