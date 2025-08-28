import React, { useState } from 'react';
import { QrCode, Camera, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { mockAttendance, mockStudents, mockCourses } from '../../../data/mockData';

export const QRAttendancePage: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendanceData, setAttendanceData] = useState(mockAttendance);

  const todayAttendance = attendanceData.filter(
    attendance => attendance.date === new Date().toISOString().split('T')[0]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Late': return 'bg-yellow-100 text-yellow-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QR Code Attendance</h1>
        <p className="text-gray-600">Scan student QR codes to mark attendance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Present Today</p>
              <p className="text-xl font-bold text-gray-900">
                {todayAttendance.filter(a => a.status === 'Present').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Late Today</p>
              <p className="text-xl font-bold text-gray-900">
                {todayAttendance.filter(a => a.status === 'Late').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Absent Today</p>
              <p className="text-xl font-bold text-gray-900">
                {mockStudents.length - todayAttendance.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">QR Scans</p>
              <p className="text-xl font-bold text-gray-900">
                {todayAttendance.filter(a => a.method === 'QR Code').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Scanner</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a course</option>
              {mockCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {isScanning ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <p className="text-gray-600">Scanning for QR codes...</p>
                <button
                  onClick={() => setIsScanning(false)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Stop Scanning
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <QrCode className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">Click to start scanning QR codes</p>
                <button
                  onClick={() => setIsScanning(true)}
                  disabled={!selectedCourse}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Scanning</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Select a course and click "Start Scanning" to begin taking attendance. 
              Students should present their ID cards with QR codes to the camera.
            </p>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {todayAttendance.map((attendance) => {
              const student = mockStudents.find(s => s.id === attendance.studentId);
              const course = mockCourses.find(c => c.id === attendance.courseId);
              
              return (
                <div key={attendance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {student?.firstName[0]}{student?.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student?.firstName} {student?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{course?.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendance.status)}`}>
                      {getStatusIcon(attendance.status)}
                      <span className="ml-1">{attendance.status}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(attendance.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {todayAttendance.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No attendance recorded today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};