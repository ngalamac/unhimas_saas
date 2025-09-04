import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Download, Plus, Users, UserPlus, Mail, Phone, CreditCard, Calendar, MapPin, GraduationCap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';
import { restoreStudent, setEnrollmentStatus, updateStudent, payTuition } from '../../../api/students';

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
  const [filterLevel, setFilterLevel] = useState('');
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
  const [tuitionDetails, setTuitionDetails] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null);
  const [studentToDeleteName, setStudentToDeleteName] = useState<string>('');

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterProgram && { program: filterProgram }),
  ...(filterLevel && { level: filterLevel }),
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
      // show toast with undo action
      showToast('Student deactivated', 'success', 8000, { label: 'Undo', onClick: async () => {
        try {
          await handleRestoreStudent(studentId);
        } catch (e: any) {
          console.error('Undo restore failed:', e);
          showToast('Failed to restore student', 'error');
        }
      }});
      fetchStudents();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete student', 'error');
    }
  };

  const handleRestoreStudent = async (studentId: string) => {
    try {
  await restoreStudent(studentId);
  showToast('Student restored', 'success');
  fetchStudents();
  fetchStats();
    } catch (err: any) {
  console.error('handleRestoreStudent error:', err);
      showToast(err.message || 'Failed to restore student', 'error');
    }
  };

  const loadTuitionForStudent = async (studentId: string) => {
    try {
      const res = await fetchClient.get(`/api/students/${studentId}/tuition`);
      if (!res.ok) throw new Error('Failed to load tuition');
      const body = await res.json();
      setTuitionDetails(body);
    } catch (e) {
      console.error('Failed to load tuition details', e);
      setTuitionDetails(null);
    }
  };

  // When opening the student view modal, load tuition details for the selected student.
  useEffect(() => {
    if (showViewModal && selectedStudent) {
      loadTuitionForStudent(selectedStudent._id);
    }
    if (!showViewModal) {
      // clear previous tuition details when modal is closed
      setTuitionDetails(null);
    }
  }, [showViewModal, selectedStudent]);

  // When opening the payment dialog, ensure tuition details for the selected student are loaded
  useEffect(() => {
    if (showPaymentDialog && selectedStudent) {
      loadTuitionForStudent(selectedStudent._id);
    }
  }, [showPaymentDialog, selectedStudent]);

  const handleExportStudents = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(selectedBranch && { branch: selectedBranch._id }),
        ...(searchTerm && { search: searchTerm }),
        ...(filterProgram && { program: filterProgram }),
  ...(filterLevel && { level: filterLevel }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(filterTuitionStatus && { tuitionStatus: filterTuitionStatus }),
        ...(filterEnrollmentStatus && { enrollmentStatus: filterEnrollmentStatus }),
        ...(filterAcademicYear && { academicYear: filterAcademicYear }),
        ...(filterGender && { gender: filterGender }),
        ...(showActiveOnly && { isActive: 'true' })
      });

  const response = await fetchClient.get(`/api/students/export?${params}`);
  const blob = await response.blob();
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

      {showPaymentDialog && selectedStudent && (
        <PaymentDialog student={selectedStudent} tuitionDetails={tuitionDetails} onClose={() => { setShowPaymentDialog(false); loadTuitionForStudent(selectedStudent._id); fetchStudents(); fetchStats(); }} />
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
                    <div className="flex items-center space-x-2 relative">
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
                          setShowPaymentDialog(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Record payment"
                      >
                        <CreditCard className="w-4 h-4" />
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
                        

                        {/* Icon-only actions (view, edit, suspend/unsuspend, deactivate/restore, email) */}
                        <div className="flex items-center space-x-2">
                      {student.isActive ? (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const newStatus = student.enrollmentStatus === 'Active' ? 'Suspended' : 'Active';
                                    await setEnrollmentStatus(student._id, newStatus);
                                    showToast(`Student ${newStatus === 'Active' ? 'unsuspended' : 'suspended'}`, 'success');
                                    fetchStudents();
                                    fetchStats();
                                  } catch (e: any) {
                                    showToast(e?.message || 'Failed to change enrollment status', 'error');
                                  }
                                }}
                                className="text-yellow-600 hover:text-yellow-900"
                                title={student.enrollmentStatus === 'Active' ? 'Suspend student' : 'Unsuspend student'}
                              >
                                <MapPin className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setStudentToDeleteId(student._id);
                                  setStudentToDeleteName(student.names || `${student.firstName} ${student.lastName}`);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Deactivate student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {student.email && (
                                <button
                                  onClick={() => { window.location.href = `mailto:${student.email}`; }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Email student"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await handleRestoreStudent(student._id);
                                } catch (e: any) {
                                  console.error('Restore failed (icon):', e);
                                  showToast(e?.message || 'Failed to restore student', 'error');
                                }
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Restore student"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40 z-40" onClick={() => setShowDeleteModal(false)} />
          <div className="bg-white rounded-lg shadow-lg relative z-50 max-w-md w-full p-6 mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm Deactivation</h3>
            <p className="text-gray-700 mb-4">Are you sure you want to deactivate <strong>{studentToDeleteName}</strong>? This will remove them from active lists but you can restore them later.</p>
            <div className="text-right">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 mr-2 bg-gray-100 rounded">Cancel</button>
              <button onClick={async () => { setShowDeleteModal(false); if (studentToDeleteId) { await handleDeleteStudent(studentToDeleteId); setStudentToDeleteId(null); setStudentToDeleteName(''); } }} className="px-4 py-2 bg-red-600 text-white rounded">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40 z-40" onClick={() => setShowViewModal(false)} />
          <div className="bg-white rounded-lg shadow-lg relative z-50 max-w-2xl w-full p-6 mx-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Student details</h3>
              <div className="space-x-2">
                <button onClick={() => { setShowPaymentDialog(true); }} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Record Payment</button>
                <button onClick={() => setShowViewModal(false)} className="text-gray-600">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div><strong>Name:</strong> {selectedStudent.names}</div>
                <div><strong>Student ID:</strong> {selectedStudent.studentId}</div>
                <div><strong>Program:</strong> {selectedStudent.program?.name}</div>
                <div><strong>Department:</strong> {selectedStudent.department?.name}</div>
                <div><strong>Phone:</strong> {selectedStudent.phoneNumber}</div>
                {selectedStudent.email && <div><strong>Email:</strong> {selectedStudent.email}</div>}
                <div><strong>Admission:</strong> {selectedStudent.academicYear} — {new Date(selectedStudent.admissionDate).toLocaleDateString()}</div>
                <div><strong>Status:</strong> {selectedStudent.enrollmentStatus} / {selectedStudent.tuitionStatus}</div>
                {selectedStudent.guardian && <div><strong>Guardian:</strong> {selectedStudent.guardian.name} — {selectedStudent.guardian.contact}</div>}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Tuition</h4>
                {tuitionDetails ? (
                  <div className="space-y-2 text-sm">
                    <div><strong>Total Paid:</strong> {tuitionDetails.student?.totalPaid || 0}</div>
                    <div><strong>Balance Due:</strong> {tuitionDetails.student?.balanceDue || 0}</div>
                    <div className="mt-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left"><th>Installment</th><th>Amount</th><th>Paid</th><th>Due Date</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {(tuitionDetails.student?.tuitionInstallments || []).map((it: any) => (
                            <tr key={it.key} className="border-t"><td className="py-1">{it.label || it.key}</td><td className="py-1">{it.amountDue}</td><td className="py-1">{it.paid}</td><td className="py-1">{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '-'}</td><td className="py-1">{it.status}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No tuition data available for this student.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && selectedStudent && (
  <EditStudentModal
          student={selectedStudent}
          onClose={() => { setShowEditModal(false); setSelectedStudent(null); }}
          onSaved={async () => { setShowEditModal(false); setSelectedStudent(null); await fetchStudents(); await fetchStats(); }}
        />
      )}
    </div>
  );
};

export default StudentsPage;

// Simple inline edit modal to avoid adding new files
function EditStudentModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const [firstName, setFirstName] = useState(student.firstName);
  const [lastName, setLastName] = useState(student.lastName);
  const [email, setEmail] = useState(student.email || '');
  const [loading, setLoading] = useState(false);
  const { showToast } = useUI();

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateStudent(student._id, { firstName, lastName, email } as any);
      showToast('Student updated', 'success');
      await onSaved();
    } catch (e: any) {
      showToast(e?.message || 'Failed to update student', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40 z-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg relative z-50 max-w-lg w-full p-6 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit student</h3>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">First name</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Last name</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
          </div>
          <div className="text-right">
            <button onClick={onClose} className="px-4 py-2 mr-2 bg-gray-100 rounded">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-orange-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentDialog({ student, tuitionDetails, onClose }: { student: Student; tuitionDetails: any; onClose: () => void }) {
  const [amount, setAmount] = useState<number>(0);
  const [installmentKey, setInstallmentKey] = useState<string>('');
  const [method, setMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useUI();

  const installments = tuitionDetails?.student?.tuitionInstallments || [];
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [isAdvance, setIsAdvance] = useState(false);

  useEffect(() => {
    // when installmentKey changes, set selectedInstallment and prefill amount to expected
    if (installmentKey) {
      const sel = installments.find((it: any) => it.key === installmentKey) || null;
      setSelectedInstallment(sel);
      if (sel) {
        setAmount(sel.amountDue - (sel.paid || 0));
        setIsAdvance(false);
      }
    } else {
      setSelectedInstallment(null);
    }
  }, [installmentKey, tuitionDetails]);

  useEffect(() => {
    // mark advance when amount is less than expected remaining for selected installment
    if (selectedInstallment) {
      const expected = Math.max(0, (selectedInstallment.amountDue || 0) - (selectedInstallment.paid || 0));
      setIsAdvance(Number(amount) < expected);
    } else {
      setIsAdvance(false);
    }
  }, [amount, selectedInstallment]);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { showToast('Enter a valid amount', 'error'); return; }
    // If an installment is selected, prevent overpayment beyond expected remaining
    if (selectedInstallment) {
      const expected = Math.max(0, (selectedInstallment.amountDue || 0) - (selectedInstallment.paid || 0));
      if (Number(amount) > expected) { showToast('Amount cannot exceed the expected remaining for the selected installment', 'error'); return; }
    }
    setLoading(true);
    try {
      await payTuition(student._id, { amount: Number(amount), installmentKey: installmentKey || undefined, method, notes });
      showToast('Payment recorded', 'success');
      onClose();
    } catch (e: any) {
      console.error('Payment failed', e);
      showToast(e?.message || 'Failed to record payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40 z-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg relative z-50 max-w-md w-full p-6 mx-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Record Payment for {student.names}</h3>
          <div>
            {selectedInstallment && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Installment: {selectedInstallment.label || selectedInstallment.key}</span>
            )}
            {isAdvance && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded ml-2 bg-blue-100 text-blue-800">Advance (pending completion)</span>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Installment</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setInstallmentKey(''); setSelectedInstallment(null); setAmount(0); }} className={`px-3 py-1 border rounded ${!installmentKey ? 'bg-orange-100 border-orange-300' : ''}`}>Earliest unpaid</button>
              {installments.map((it: any) => {
                const remaining = Math.max(0, (it.amountDue || 0) - (it.paid || 0));
                const selected = installmentKey === it.key;
                return (
                  <button key={it.key} type="button" onClick={() => { setInstallmentKey(it.key); }} className={`px-3 py-1 border rounded ${selected ? 'bg-orange-100 border-orange-300' : ''}`}>
                    <div className="text-xs font-medium">{it.label || it.key}</div>
                    <div className="text-xs text-gray-600">{remaining} due • {it.dueDate ? new Date(it.dueDate).toLocaleDateString() : 'n/a'}</div>
                  </button>
                );
              })}
            </div>
            {selectedInstallment && (
              <div className="mt-2 text-sm text-gray-700">Expected remaining: <strong>{Math.max(0, (selectedInstallment.amountDue || 0) - (selectedInstallment.paid || 0))}</strong></div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option>Cash</option>
              <option>Mobile Money</option>
              <option>Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving...' : 'Record Payment'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
