import React from 'react';
import { Users, BookOpen, TrendingUp, Calendar, Award, UserCheck } from 'lucide-react';

export const HODDashboard: React.FC = () => {
  const currentBatch = getCurrentBatchData();
  const myDepartment = 'Computer Engineering'; // Mock department
  const departmentStudents = mockStudents.filter(s => s.department.name === myDepartment);
  const departmentCourses = mockCourses.filter(c => c.department.name === myDepartment);
  const departmentLecturers = mockEmployees.filter(e => e.department?.name === myDepartment && e.role === 'Lecturer');
  const departmentGrades = mockGrades.filter(g => 
    departmentCourses.some(c => c.id === g.courseId)
  );

  const averageGPA = departmentGrades.length > 0 
    ? departmentGrades.reduce((sum, g) => sum + g.gpa, 0) / departmentGrades.length 
    : 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Head of Department Dashboard</h1>
          <p className="text-gray-600">Department: {myDepartment}</p>
          <p className="text-sm text-blue-600">Current Batch: {currentBatch?.name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{new Date().toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Department Students</p>
              <p className="text-2xl font-bold text-gray-900">{departmentStudents.length}</p>
              <p className="text-xs text-blue-600">All levels</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Department Courses</p>
              <p className="text-2xl font-bold text-gray-900">{departmentCourses.length}</p>
              <p className="text-xs text-green-600">Active courses</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Lecturers</p>
              <p className="text-2xl font-bold text-gray-900">{departmentLecturers.length}</p>
              <p className="text-xs text-purple-600">Teaching staff</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Dept. Average GPA</p>
              <p className="text-2xl font-bold text-gray-900">{averageGPA.toFixed(2)}</p>
              <p className="text-xs text-orange-600">This semester</p>
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
              <BookOpen className="w-4 h-4" />
              <span>Manage Courses</span>
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>View Students</span>
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Department Report</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Level 1</span>
              <span className="font-medium">{departmentStudents.filter(s => s.level === 1).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Level 2</span>
              <span className="font-medium">{departmentStudents.filter(s => s.level === 2).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Level 3</span>
              <span className="font-medium">{departmentStudents.filter(s => s.level === 3).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Level 4</span>
              <span className="font-medium">{departmentStudents.filter(s => s.level === 4).length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>New course approved</span>
              <span className="text-gray-500 ml-auto">1h ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Lecturer assigned</span>
              <span className="text-gray-500 ml-auto">3h ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Grade submission</span>
              <span className="text-gray-500 ml-auto">5h ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Courses */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentCourses.map((course) => (
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
                <div>Lecturer: {course.lecturer ? `${course.lecturer.firstName} ${course.lecturer.lastName}` : 'Not assigned'}</div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                  View Details
                </button>
                <button className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                  Assign Lecturer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};