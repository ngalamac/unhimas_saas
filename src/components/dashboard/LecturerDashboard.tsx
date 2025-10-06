import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Calendar, TrendingUp, Clock, CheckCircle, DollarSign, Plus } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import fetchClient from '../../lib/fetchClient';
import { formatXAF } from '../../utils/currency';

export const LecturerDashboard: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myStudentsCount, setMyStudentsCount] = useState<number>(0);
  const [summary, setSummary] = useState<{ totalHours: number; pendingHours: number; hourlyRate: number; estimatedSalary: number; approvedSessions: number; pendingSessions: number }>({ totalHours: 0, pendingHours: 0, hourlyRate: 0, estimatedSalary: 0, approvedSessions: 0, pendingSessions: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch my teaching sessions summary for current month
        if (user?.employeeId) {
          const now = new Date();
          const month = now.getMonth() + 1; const year = now.getFullYear();
          const res = await fetchClient.get(`/api/teaching-sessions/lecturer/${encodeURIComponent(user.employeeId)}/summary?month=${month}&year=${year}`);
          if (res.ok) {
            const body = await res.json();
            const d = body.data || {};
            setSummary({
              totalHours: d.totalHours || 0,
              pendingHours: d.pendingHours || 0,
              hourlyRate: d.hourlyRate || 0,
              estimatedSalary: d.estimatedSalary || 0,
              approvedSessions: d.approvedSessions || 0,
              pendingSessions: d.pendingSessions || 0,
            });
          }
        }
        // Fetch my courses
        const coursesRes = await fetchClient.get('/api/courses');
        const courses = coursesRes.ok ? await coursesRes.json() : [];
        setMyCourses(Array.isArray(courses) ? courses : (courses.data || []));
        // Approximate students by counting students in the same programs as my courses
        try {
          const studentsStats = await fetchClient.get('/api/students/stats/overview');
          const ssBody = studentsStats.ok ? await studentsStats.json() : {};
          setMyStudentsCount(ssBody?.data?.total || ssBody?.total || 0);
        } catch {}
      } catch (e) {}
    };
    load();
  }, [user?.employeeId]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lecturer Dashboard</h1>
          <p className="text-gray-600">Academic management and student progress</p>
          <p className="text-sm text-blue-600">Welcome, {user?.firstName || user?.username}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{new Date().toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Lecturer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">My Courses</p>
              <p className="text-2xl font-bold text-gray-900">{myCourses.length}</p>
              <p className="text-xs text-blue-600">Active this semester</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">My Students</p>
              <p className="text-2xl font-bold text-gray-900">{myStudentsCount}</p>
              <p className="text-xs text-green-600">Across all courses</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Attendance Today</p>
              <p className="text-2xl font-bold text-gray-900">{summary.approvedSessions}</p>
              <p className="text-xs text-purple-600">Students present</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Grades Recorded</p>
              <p className="text-2xl font-bold text-gray-900">{summary.pendingSessions}</p>
              <p className="text-xs text-orange-600">This semester</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Est. Monthly Salary</p>
              <p className="text-2xl font-bold text-gray-900">{formatXAF(summary.estimatedSalary)}</p>
              <p className="text-xs text-yellow-600">{summary.totalHours}h @ {formatXAF(summary.hourlyRate)}/h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Take Attendance</span>
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Record Grades</span>
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>View Students</span>
            </button>
            <button 
              onClick={() => {
                setCurrentPage('teaching-sessions');
                setBreadcrumb(['Human Resources', 'Teaching Sessions']);
              }}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Teaching Hours</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Hours Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Hours Worked</span>
              <span className="font-medium text-gray-900">{currentMonthHours}h</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Hourly Rate</span>
              <span className="font-medium text-gray-900">{formatXAF(hourlyRate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pending Sessions</span>
              <span className="font-medium text-yellow-600">{pendingSessions}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-3">
              <span className="text-gray-900 font-medium">Estimated Salary</span>
              <span className="font-bold text-green-600">{formatXAF(estimatedSalary)}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setCurrentPage('payroll');
              setBreadcrumb(['Human Resources', 'Payroll Dashboard']);
            }}
            className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            View Payroll Details
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Data Structures</p>
                <p className="text-xs text-gray-600">8:00 AM - 10:00 AM</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
              <Clock className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Web Development</p>
                <p className="text-xs text-gray-600">2:00 PM - 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Grade midterm exams</span>
              <span className="text-red-500 ml-auto">Overdue</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Update course materials</span>
              <span className="text-yellow-500 ml-auto">Due today</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Prepare next lecture</span>
              <span className="text-blue-500 ml-auto">Tomorrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Courses */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCourses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{course.name}</h4>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {course.creditValue} Credits
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Code: {course.code}</div>
                <div>Level: {course.level}</div>
                <div>Semester: {course.semester}</div>
                <div>Students: {myStudents.filter(s => s.department.id === course.department.id).length}</div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                  View Details
                </button>
                <button className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                  Take Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};