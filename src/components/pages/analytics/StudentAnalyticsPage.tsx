import React from 'react';
import { TrendingUp, Users, GraduationCap, BarChart3 } from 'lucide-react';

export const StudentAnalyticsPage: React.FC = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Analytics</h1>
        <p className="text-gray-600">Comprehensive analysis of student data and performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Enrollment</p>
              <p className="text-xl font-bold text-gray-900">1,247</p>
              <p className="text-xs text-green-600">↗ +12% from last year</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Retention Rate</p>
              <p className="text-xl font-bold text-gray-900">94.2%</p>
              <p className="text-xs text-green-600">↗ +2.1% from last year</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average GPA</p>
              <p className="text-xl font-bold text-gray-900">3.2</p>
              <p className="text-xs text-green-600">↗ +0.3 from last semester</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-xl font-bold text-gray-900">87.5%</p>
              <p className="text-xs text-red-600">↘ -1.2% from last month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trends */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trends (2020-2025)</h2>
          <div className="h-64">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <pattern id="grid3" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid3)" />
              
              {/* Y-axis labels */}
              <text x="10" y="20" className="text-xs fill-gray-500">1400</text>
              <text x="10" y="60" className="text-xs fill-gray-500">1200</text>
              <text x="10" y="100" className="text-xs fill-gray-500">1000</text>
              <text x="10" y="140" className="text-xs fill-gray-500">800</text>
              <text x="10" y="180" className="text-xs fill-gray-500">600</text>
              
              {/* X-axis labels */}
              <text x="60" y="195" className="text-xs fill-gray-500">2020</text>
              <text x="120" y="195" className="text-xs fill-gray-500">2021</text>
              <text x="180" y="195" className="text-xs fill-gray-500">2022</text>
              <text x="240" y="195" className="text-xs fill-gray-500">2023</text>
              <text x="300" y="195" className="text-xs fill-gray-500">2024</text>
              <text x="360" y="195" className="text-xs fill-gray-500">2025</text>
              
              {/* Trend line */}
              <path
                d="M 60 140 L 120 130 L 180 110 L 240 90 L 300 70 L 360 50"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Data points */}
              <circle cx="60" cy="140" r="4" fill="#3b82f6" />
              <circle cx="120" cy="130" r="4" fill="#3b82f6" />
              <circle cx="180" cy="110" r="4" fill="#3b82f6" />
              <circle cx="240" cy="90" r="4" fill="#3b82f6" />
              <circle cx="300" cy="70" r="4" fill="#3b82f6" />
              <circle cx="360" cy="50" r="4" fill="#3b82f6" />
            </svg>
          </div>
        </div>

        {/* Program Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Distribution by Program</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium text-gray-900">HND Programs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-sm text-gray-600">498 (40%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium text-gray-900">Bachelor Programs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm text-gray-600">561 (45%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm font-medium text-gray-900">Masters Programs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <span className="text-sm text-gray-600">188 (15%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Performance (Average GPA)</h2>
          <div className="space-y-3">
            {[
              { name: 'Computer Engineering', gpa: 3.4, students: 312 },
              { name: 'Business Administration', gpa: 3.2, students: 289 },
              { name: 'Accounting', gpa: 3.1, students: 234 },
              { name: 'HR Management', gpa: 3.0, students: 198 },
              { name: 'Transport & Logistics', gpa: 2.9, students: 214 }
            ].map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{dept.name}</p>
                  <p className="text-sm text-gray-600">{dept.students} students</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{dept.gpa}</p>
                  <p className="text-sm text-gray-600">GPA</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h2>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray="150.8 251.2"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="12"
                  strokeDasharray="100.4 251.2"
                  strokeDashoffset="-150.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Male (60%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Female (40%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};