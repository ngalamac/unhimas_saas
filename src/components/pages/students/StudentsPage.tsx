import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Download, Plus, Users, UserPlus, Mail, Phone, CreditCard, Calendar, MapPin, GraduationCap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  names: string;
  studentId: string;
  dateOfBirth: string;
  placeOfBirth: string;
  regionOfOrigin: string;
  phoneNumber: string;
  gender: 'Male' | 'Female';
  email?: string;
  program: {
    _id: string;
    name: string;
  };
  department: {
    _id: string;
    name: string;
  };
  branch: {
    _id: string;
    name: string;
  };
  profilePicture?: string;
  level?: string | number;
  session?: string;
  tuitionStatus: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  enrollmentStatus: 'Active' | 'Suspended' | 'Graduated' | 'Withdrawn';
  admissionDate: string;
  academicYear: string;
  isActive: boolean;
  guardian: {
    name: string;
    address?: string;
    contact?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  address?: {
    street: string;
    city: string;
    region: string;
    country: string;
    postalCode?: string;
  };
  notes?: string;
  createdBy: {
    _id: string;
    name: string;
  };
  lastModifiedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StudentStats {
  total: number;
  enrollment: {
    active: number;
    suspended: number;
    graduated: number;
    withdrawn: number;
  };
  tuition: {
    paid: number;
    partial: number;
    pending: number;
    overdue: number;
  };
  byGender: Array<{ _id: string; count: number }>;
  byProgram: Array<{ _id: string; count: number }>;
}

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { showToast } = useUI();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterTuitionStatus, setFilterTuitionStatus] = useState('');
  const [filterEnrollmentStatus, setFilterEnrollmentStatus] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // UI State
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterProgram && { program: filterProgram }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(filterTuitionStatus && { tuitionStatus: filterTuitionStatus }),
        ...(filterEnrollmentStatus && { enrollmentStatus: filterEnrollmentStatus }),
        ...(filterAcademicYear && { academicYear: filterAcademicYear }),
        ...(filterGender && { gender: filterGender }),
        ...(showActiveOnly && { isActive: 'true' }),
        ...(selectedBranch && { branch: selectedBranch._id })
      });

      const response = await fetchClient.get(`/api/students?${params}`);
      const data = await response.json();
      setStudents(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students');
      showToast('Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.append('branch', selectedBranch._id);
      }

      const response = await fetchClient.get(`/api/students/stats/overview?${params}`);
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch student statistics:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, pageSize, searchTerm, filterProgram, filterDepartment, filterTuitionStatus, filterEnrollmentStatus, filterAcademicYear, filterGender, showActiveOnly, selectedBranch]);

  useEffect(() => {
    fetchStats();
  }, [selectedBranch]);

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await fetchClient.delete(`/api/students/${studentId}`);
      showToast('Student deactivated successfully', 'success');
      fetchStudents();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete student', 'error');
    }
  };

  const handleExportStudents = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(selectedBranch && { branch: selectedBranch._id }),
        ...(searchTerm && { search: searchTerm }),
        ...(filterProgram && { program: filterProgram }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(filterTuitionStatus && { tuitionStatus: filterTuitionStatus }),
        ...(filterEnrollmentStatus && { enrollmentStatus: filterEnrollmentStatus }),
        ...(filterAcademicYear && { academicYear: filterAcademicYear }),
        ...(filterGender && { gender: filterGender }),
        ...(showActiveOnly && { isActive: 'true' })
      });

      const response = await fetchClient.get(`/api/students/export?${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Students exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export students', 'error');
    }
  };

  const getStatusColor = (status: string, type: 'tuition' | 'enrollment') => {
    if (type === 'tuition') {
      switch (status) {
        case 'Paid': return 'bg-green-100 text-green-800';
        case 'Partial': return 'bg-yellow-100 text-yellow-800';
        case 'Pending': return 'bg-blue-100 text-blue-800';
        case 'Overdue': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else {
      switch (status) {
        case 'Active': return 'bg-green-100 text-green-800';
        case 'Suspended': return 'bg-yellow-100 text-yellow-800';
        case 'Graduated': return 'bg-blue-100 text-blue-800';
        case 'Withdrawn': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPhone = (phone: string) => {
    // Format Cameroon phone numbers
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else if (digits.length === 12 && digits.startsWith('237')) {
      return `+237 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }
    return phone;
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600">Manage student records and information</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.enrollment.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid Tuition</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tuition.paid}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Tuition</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tuition.overdue}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tuition Status</label>
              <select
                value={filterTuitionStatus}
                onChange={(e) => setFilterTuitionStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
              <select
                value={filterEnrollmentStatus}
                onChange={(e) => setFilterEnrollmentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Graduated">Graduated</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="activeOnly"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="activeOnly" className="ml-2 block text-sm text-gray-900">
                Show active students only
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Students ({total})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportStudents('csv')}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExportStudents('xlsx')}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {student.profilePicture ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={student.profilePicture}
                            alt={student.names}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.names}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {student.studentId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.program?.name}</div>
                    <div className="text-sm text-gray-500">{student.department?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {formatPhone(student.phoneNumber)}
                    </div>
                    {student.email && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {student.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.tuitionStatus, 'tuition')}`}>
                        {student.tuitionStatus}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.enrollmentStatus, 'enrollment')}`}>
                        {student.enrollmentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(student.admissionDate)}
                    </div>
                    <div className="text-sm text-gray-500">{student.academicYear}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowEditModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= total}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {students.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterTuitionStatus || filterEnrollmentStatus || filterGender
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding a new student.'}
          </p>
          {!searchTerm && !filterTuitionStatus && !filterEnrollmentStatus && !filterGender && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
