import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Plus, 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  MapPin, 
  GraduationCap,
  MoreVertical,
  RefreshCw,
  FileText,
  Settings,
  Grid,
  List,
  SortAsc,
  SortDesc,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Building2
} from 'lucide-react';
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
  // Program list for filter dropdown
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all programs for filter dropdown
    const fetchPrograms = async () => {
      try {
        const res = await fetchClient.get('/api/programs');
        const data = await res.json();
        setPrograms(data);
      } catch (err) {
        console.error('Failed to fetch programs', err);
      }
    };
    fetchPrograms();
  }, []);
  // Example filter dropdown for programs (add to your filter UI):
  // <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
  //   <option value="">All Programs</option>
  //   {programs.map(p => (
  //     <option key={p._id} value={p._id}>{p.name}</option>
  //   ))}
  // </select>
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { showToast } = useUI();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterTuitionStatus, setFilterTuitionStatus] = useState('');
  const [filterEnrollmentStatus, setFilterEnrollmentStatus] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  
  // UI State
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [tuitionDetails, setTuitionDetails] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null);
  const [studentToDeleteName, setStudentToDeleteName] = useState<string>('');
  const [showBulkActions, setShowBulkActions] = useState(false);

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
        ...(selectedBranch && { branch: selectedBranch._id }),
        sort: `${sortBy}:${sortOrder}`
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
  }, [page, pageSize, searchTerm, filterProgram, filterDepartment, filterTuitionStatus, filterEnrollmentStatus, filterAcademicYear, filterGender, showActiveOnly, selectedBranch, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, [selectedBranch]);

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await fetchClient.delete(`/api/students/${studentId}`);
      showToast('Student deactivated', 'success', 8000, { 
        label: 'Undo', 
        onClick: async () => {
          try {
            await handleRestoreStudent(studentId);
          } catch (e: any) {
            console.error('Undo restore failed:', e);
            showToast('Failed to restore student', 'error');
          }
        }
      });
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

  useEffect(() => {
    if (showViewModal && selectedStudent) {
      loadTuitionForStudent(selectedStudent._id);
    }
    if (!showViewModal) {
      setTuitionDetails(null);
    }
  }, [showViewModal, selectedStudent]);

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
        ...(showActiveOnly && { isActive: 'true' }),
        ...(selectedStudents.length > 0 && { ids: selectedStudents.join(',') })
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

  const handleBulkAction = async (action: string) => {
    if (selectedStudents.length === 0) {
      showToast('No students selected', 'warning');
      return;
    }

    switch (action) {
      case 'export':
        await handleExportStudents('xlsx');
        break;
      case 'activate':
        // Bulk activate students
        try {
          await Promise.all(selectedStudents.map(id => 
            fetchClient.put(`/api/students/${id}`, { isActive: true })
          ));
          showToast(`${selectedStudents.length} students activated`, 'success');
          setSelectedStudents([]);
          fetchStudents();
        } catch (err: any) {
          showToast('Failed to activate some students', 'error');
        }
        break;
      case 'deactivate':
        if (confirm(`Deactivate ${selectedStudents.length} selected students?`)) {
          try {
            await Promise.all(selectedStudents.map(id => 
              fetchClient.delete(`/api/students/${id}`)
            ));
            showToast(`${selectedStudents.length} students deactivated`, 'success');
            setSelectedStudents([]);
            fetchStudents();
          } catch (err: any) {
            showToast('Failed to deactivate some students', 'error');
          }
        }
        break;
    }
    setShowBulkActions(false);
  };

  const getStatusColor = (status: string, type: 'tuition' | 'enrollment') => {
    if (type === 'tuition') {
      switch (status) {
        case 'Paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Partial': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'Pending': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else {
      switch (status) {
        case 'Active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Suspended': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'Graduated': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Withdrawn': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else if (digits.length === 12 && digits.startsWith('237')) {
      return `+237 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }
    return phone;
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s._id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterProgram('');
    setFilterLevel('');
    setFilterDepartment('');
    setFilterTuitionStatus('');
    setFilterEnrollmentStatus('');
    setFilterAcademicYear('');
    setFilterGender('');
    setShowActiveOnly(true);
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
                <p className="text-gray-600 mt-1">Comprehensive student records and analytics</p>
                {selectedBranch && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">{selectedBranch.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchStudents()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{(stats?.total ?? 0).toLocaleString()}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">{(stats?.enrollment?.active ?? 0)} active</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 font-medium">Enrollment Rate</span>
                  <span className="text-blue-800 font-bold">
                    {(((stats?.enrollment?.active ?? 0) / (stats?.total ?? 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Students</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{(stats?.enrollment?.active ?? 0).toLocaleString()}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600">Currently enrolled</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-700 font-medium">vs Last Month</span>
                  <span className="text-emerald-800 font-bold">+12.5%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paid Tuition</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{(stats?.tuition?.paid ?? 0).toLocaleString()}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <CreditCard className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600">Fully paid</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 font-medium">Collection Rate</span>
                  <span className="text-green-800 font-bold">
                    {(((stats?.tuition?.paid ?? 0) / (stats?.total ?? 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue Tuition</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{(stats?.tuition?.overdue ?? 0).toLocaleString()}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-600">Needs attention</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-700 font-medium">Requires Follow-up</span>
                  <span className="text-red-800 font-bold">
                    {(((stats?.tuition?.overdue ?? 0) / (stats?.total ?? 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 lg:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search students by name, ID, email, or phone..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-lg transition-all flex items-center space-x-2 ${
                    showFilters 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {(filterProgram || filterLevel || filterDepartment || filterTuitionStatus || filterEnrollmentStatus || filterAcademicYear || filterGender) && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {[filterProgram, filterLevel, filterDepartment, filterTuitionStatus, filterEnrollmentStatus, filterAcademicYear, filterGender].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
                
                {selectedStudents.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Actions ({selectedStudents.length})</span>
                    </button>
                    {showBulkActions && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border z-10 min-w-48">
                        <div className="p-2">
                          <button
                            onClick={() => handleBulkAction('export')}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export Selected</span>
                          </button>
                          <button
                            onClick={() => handleBulkAction('activate')}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Activate Selected</span>
                          </button>
                          <button
                            onClick={() => handleBulkAction('deactivate')}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Deactivate Selected</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="border-t border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Programs</option>
                    {/* This would be populated from programs API */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Levels</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Status</label>
                  <select
                    value={filterTuitionStatus}
                    onChange={(e) => setFilterTuitionStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment</label>
                  <select
                    value={filterEnrollmentStatus}
                    onChange={(e) => setFilterEnrollmentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <select
                    value={filterAcademicYear}
                    onChange={(e) => setFilterAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Years</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Show active students only</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear All
                  </button>
                  <span className="text-sm text-gray-500">
                    {students.length} of {total} students
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Students Table/Grid */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Students ({total.toLocaleString()})
                </h3>
                {selectedStudents.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedStudents.length} selected
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleExportStudents('csv')}
                    className="px-3 py-1 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-md transition-all"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExportStudents('xlsx')}
                    className="px-3 py-1 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-md transition-all"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => handleExportStudents('pdf')}
                    className="px-3 py-1 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-md transition-all"
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === students.length && students.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('names')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Student</span>
                        {sortBy === 'names' && (
                          sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program & Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('admissionDate')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Admission</span>
                        {sortBy === 'admissionDate' && (
                          sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleSelectStudent(student._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {student.profilePicture ? (
                              <img
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                src={student.profilePicture}
                                alt={student.names}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-200">
                                <span className="text-sm font-bold text-white">
                                  {student.firstName[0]}{student.lastName[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {student.names}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <span>ID: {student.studentId}</span>
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                student.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                              }`}>
                                {student.gender}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{student.program?.name}</div>
                        <div className="text-sm text-gray-500">{student.department?.name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">
                            Level {student.level}
                          </span>
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">
                            {student.session}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center space-x-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{formatPhone(student.phoneNumber)}</span>
                        </div>
                        {student.email && (
                          <div className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-32">{student.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(student.tuitionStatus, 'tuition')}`}>
                            <CreditCard className="w-3 h-3 mr-1" />
                            {student.tuitionStatus}
                          </span>
                          <br />
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(student.enrollmentStatus, 'enrollment')}`}>
                            <UserCheck className="w-3 h-3 mr-1" />
                            {student.enrollmentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(student.admissionDate)}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{student.academicYear}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowPaymentDialog(true);
                            }}
                            className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-amber-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <div className="relative group">
                            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-10 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                              <div className="p-2">
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
                                      className="w-full text-left px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-md flex items-center space-x-2"
                                    >
                                      <Clock className="w-4 h-4" />
                                      <span>{student.enrollmentStatus === 'Active' ? 'Suspend' : 'Unsuspend'}</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setStudentToDeleteId(student._id);
                                        setStudentToDeleteName(student.names || `${student.firstName} ${student.lastName}`);
                                        setShowDeleteModal(true);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Deactivate</span>
                                    </button>
                                    {student.email && (
                                      <button
                                        onClick={() => { window.location.href = `mailto:${student.email}`; }}
                                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center space-x-2"
                                      >
                                        <Mail className="w-4 h-4" />
                                        <span>Email Student</span>
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
                                    className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md flex items-center space-x-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Restore Student</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {students.map((student) => (
                  <div key={student._id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="relative">
                          {student.profilePicture ? (
                            <img
                              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                              src={student.profilePicture}
                              alt={student.names}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-200">
                              <span className="text-lg font-bold text-white">
                                {student.firstName[0]}{student.lastName[0]}
                              </span>
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                            student.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{student.names}</h3>
                          <p className="text-sm text-gray-500">ID: {student.studentId}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              student.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                            }`}>
                              {student.gender}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.program?.name}</p>
                          <p className="text-xs text-gray-500">{student.department?.name} • Level {student.level}</p>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span className="truncate">{formatPhone(student.phoneNumber)}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.tuitionStatus, 'tuition')}`}>
                            <CreditCard className="w-3 h-3 mr-1" />
                            {student.tuitionStatus}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.enrollmentStatus, 'enrollment')}`}>
                            <UserCheck className="w-3 h-3 mr-1" />
                            {student.enrollmentStatus}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Admitted: {formatDate(student.admissionDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleSelectStudent(student._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowPaymentDialog(true);
                            }}
                            className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-all"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-amber-600 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-all"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Pagination */}
          {total > pageSize && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((page - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{' '}
                  <span className="font-medium">{total.toLocaleString()}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                      const pageNum = Math.max(1, page - 2) + i;
                      if (pageNum > Math.ceil(total / pageSize)) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * pageSize >= total}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPage(Math.ceil(total / pageSize))}
                    disabled={page * pageSize >= total}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Empty State */}
        {students.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterTuitionStatus || filterEnrollmentStatus || filterGender
                  ? 'Try adjusting your filters to see more results, or clear all filters to view all students.'
                  : 'Get started by adding your first student to the system.'}
              </p>
              <div className="flex items-center justify-center space-x-3">
                {(searchTerm || filterTuitionStatus || filterEnrollmentStatus || filterGender) && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                )}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Student</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Dialog */}
        {showPaymentDialog && selectedStudent && (
          <PaymentDialog 
            student={selectedStudent} 
            tuitionDetails={tuitionDetails} 
            onClose={() => { 
              setShowPaymentDialog(false); 
              if (selectedStudent) {
                loadTuitionForStudent(selectedStudent._id); 
              }
              fetchStudents(); 
              fetchStats(); 
            }} 
          />
        )}

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Deactivation</h3>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to deactivate <strong>{studentToDeleteName}</strong>? 
                  This will remove them from active lists but you can restore them later.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button 
                    onClick={() => setShowDeleteModal(false)} 
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => { 
                      setShowDeleteModal(false); 
                      if (studentToDeleteId) { 
                        await handleDeleteStudent(studentToDeleteId); 
                        setStudentToDeleteId(null); 
                        setStudentToDeleteName(''); 
                      } 
                    }} 
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced View Modal */}
        {showViewModal && selectedStudent && (
          <StudentDetailsModal 
            student={selectedStudent}
            tuitionDetails={tuitionDetails}
            onClose={() => setShowViewModal(false)}
            onEdit={() => {
              setShowViewModal(false);
              setShowEditModal(true);
            }}
            onPayment={() => {
              setShowViewModal(false);
              setShowPaymentDialog(true);
            }}
          />
        )}

        {/* Edit modal */}
        {showEditModal && selectedStudent && (
          <EditStudentModal
            student={selectedStudent}
            onClose={() => { setShowEditModal(false); setSelectedStudent(null); }}
            onSaved={async () => { 
              setShowEditModal(false); 
              setSelectedStudent(null); 
              await fetchStudents(); 
              await fetchStats(); 
            }}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Student Details Modal
function StudentDetailsModal({ 
  student, 
  tuitionDetails, 
  onClose, 
  onEdit, 
  onPayment 
}: { 
  student: Student; 
  tuitionDetails: any; 
  onClose: () => void;
  onEdit: () => void;
  onPayment: () => void;
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { id: 'academic', label: 'Academic', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'financial', label: 'Financial', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact', icon: <Phone className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {student.profilePicture ? (
                <img
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                  src={student.profilePicture}
                  alt={student.names}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-lg font-bold text-white">
                    {student.firstName[0]}{student.lastName[0]}
                  </span>
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                student.isActive ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.names}</h2>
              <p className="text-gray-600">Student ID: {student.studentId}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.enrollmentStatus, 'enrollment')}`}>
                  <UserCheck className="w-3 h-3 mr-1" />
                  {student.enrollmentStatus}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.tuitionStatus, 'tuition')}`}>
                  <CreditCard className="w-3 h-3 mr-1" />
                  {student.tuitionStatus}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onPayment}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Personal Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">{student.names}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-medium">{formatDate(student.dateOfBirth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Place of Birth:</span>
                    <span className="font-medium">{student.placeOfBirth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region of Origin:</span>
                    <span className="font-medium">{student.regionOfOrigin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">{student.gender}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Guardian Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guardian Name:</span>
                    <span className="font-medium">{student.guardian?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guardian Contact:</span>
                    <span className="font-medium">{student.guardian?.contact || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guardian Address:</span>
                    <span className="font-medium text-right max-w-48">{student.guardian?.address || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Academic Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Program:</span>
                    <span className="font-medium">{student.program?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{student.department?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level:</span>
                    <span className="font-medium">Level {student.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session:</span>
                    <span className="font-medium">{student.session}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium">{student.academicYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admission Date:</span>
                    <span className="font-medium">{formatDate(student.admissionDate)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Status Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Enrollment Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.enrollmentStatus, 'enrollment')}`}>
                      <UserCheck className="w-3 h-3 mr-1" />
                      {student.enrollmentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created By:</span>
                    <span className="font-medium">{student.createdBy?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created Date:</span>
                    <span className="font-medium">{formatDate(student.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Tuition Information</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(student.tuitionStatus, 'tuition')}`}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {student.tuitionStatus}
                </span>
              </div>
              
              {tuitionDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Total Paid</p>
                      <p className="text-2xl font-bold text-green-700">
                        {(tuitionDetails.student?.totalPaid || 0).toLocaleString()} XAF
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600 font-medium">Balance Due</p>
                      <p className="text-2xl font-bold text-red-700">
                        {(tuitionDetails.student?.balanceDue || 0).toLocaleString()} XAF
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">Installments</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {(tuitionDetails.student?.tuitionInstallments || []).length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Installment Breakdown</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b border-gray-200">
                            <th className="pb-2 font-medium text-gray-700">Installment</th>
                            <th className="pb-2 font-medium text-gray-700">Amount Due</th>
                            <th className="pb-2 font-medium text-gray-700">Paid</th>
                            <th className="pb-2 font-medium text-gray-700">Due Date</th>
                            <th className="pb-2 font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(tuitionDetails.student?.tuitionInstallments || []).map((installment: any, index: number) => (
                            <tr key={installment.key || index} className="border-b border-gray-100">
                              <td className="py-3 font-medium">{installment.label || installment.key}</td>
                              <td className="py-3">{(installment.amountDue || 0).toLocaleString()} XAF</td>
                              <td className="py-3">{(installment.paid || 0).toLocaleString()} XAF</td>
                              <td className="py-3">
                                {installment.dueDate ? formatDate(installment.dueDate) : '—'}
                              </td>
                              <td className="py-3">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  installment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                  installment.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                  installment.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {installment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No tuition data available for this student.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Student Contact</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium">{student.phoneNumber}</p>
                    </div>
                  </div>
                  {student.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-medium">{student.email}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">
                        {student.address ? 
                          `${student.address.street}, ${student.address.city}, ${student.address.region}` : 
                          '—'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Emergency Contact</h4>
                {student.emergencyContact ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{student.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Relationship:</span>
                      <span className="font-medium">{student.emergencyContact.relationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{student.emergencyContact.phone}</span>
                    </div>
                    {student.emergencyContact.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{student.emergencyContact.email}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No emergency contact information available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Edit Student Modal
function EditStudentModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const [firstName, setFirstName] = useState(student.firstName);
  const [lastName, setLastName] = useState(student.lastName);
  const [email, setEmail] = useState(student.email || '');
  const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUI();

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateStudent(student._id, { firstName, lastName, email, phoneNumber } as any);
      showToast('Student updated successfully', 'success');
      await onSaved();
    } catch (e: any) {
      showToast(e?.message || 'Failed to update student', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Edit Student Information</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input 
                value={firstName} 
                onChange={e => setFirstName(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input 
                value={lastName} 
                onChange={e => setLastName(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input 
              type="tel"
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Payment Dialog
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
    if (selectedInstallment) {
      const expected = Math.max(0, (selectedInstallment.amountDue || 0) - (selectedInstallment.paid || 0));
      setIsAdvance(Number(amount) < expected);
    } else {
      setIsAdvance(false);
    }
  }, [amount, selectedInstallment]);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { 
      showToast('Enter a valid amount', 'error'); 
      return; 
    }
    
    if (selectedInstallment) {
      const expected = Math.max(0, (selectedInstallment.amountDue || 0) - (selectedInstallment.paid || 0));
      if (Number(amount) > expected) { 
        showToast('Amount cannot exceed the expected remaining for the selected installment', 'error'); 
        return; 
      }
    }
    
    setLoading(true);
    try {
      await payTuition(student._id, { 
        amount: Number(amount), 
        installmentKey: installmentKey || undefined, 
        method, 
        notes 
      });
      showToast('Payment recorded successfully', 'success');
      onClose();
    } catch (e: any) {
      console.error('Payment failed', e);
      showToast(e?.message || 'Failed to record payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Record Payment</h3>
              <p className="text-gray-600">for {student.names}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount (XAF)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">XAF</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))} 
                className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
                placeholder="0"
              />
            </div>
            {amount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Amount: {amount.toLocaleString()} XAF
              </p>
            )}
          </div>

          {/* Installment Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Apply to Installment</label>
            <div className="grid grid-cols-1 gap-3">
              <button 
                type="button" 
                onClick={() => { 
                  setInstallmentKey(''); 
                  setSelectedInstallment(null); 
                  setAmount(0); 
                }} 
                className={`p-3 border rounded-lg text-left transition-all ${
                  !installmentKey ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">Apply to earliest unpaid installment</div>
                <div className="text-sm text-gray-600">System will automatically distribute the payment</div>
              </button>
              
              {installments.map((installment: any) => {
                const remaining = Math.max(0, (installment.amountDue || 0) - (installment.paid || 0));
                const selected = installmentKey === installment.key;
                return (
                  <button 
                    key={installment.key} 
                    type="button" 
                    onClick={() => { setInstallmentKey(installment.key); }} 
                    className={`p-3 border rounded-lg text-left transition-all ${
                      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{installment.label || installment.key}</div>
                        <div className="text-sm text-gray-600">
                          {remaining.toLocaleString()} XAF remaining
                          {installment.dueDate && ` • Due: ${formatDate(installment.dueDate)}`}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        installment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        installment.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                        installment.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {installment.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {selectedInstallment && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Expected remaining:</strong> {Math.max(0, (selectedInstallment.amountDue || 0) - (selectedInstallment.paid || 0)).toLocaleString()} XAF
                </p>
                {isAdvance && (
                  <p className="text-sm text-amber-700 mt-1">
                    <strong>Note:</strong> This payment is less than the full installment amount and will be marked as an advance.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select 
              value={method} 
              onChange={(e) => setMethod(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Cash">Cash</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online Payment</option>
              <option value="Check">Check</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add any additional notes about this payment..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !amount || amount <= 0}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{loading ? 'Recording...' : 'Record Payment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentsPage;