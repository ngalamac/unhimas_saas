import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Download, Plus, Users, Mail, Phone, MapPin, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  names: string;
  email: string;
  phoneNumber: string;
  employeeId: string;
  department: string;
  position: string;
  type: 'Lecturer' | 'Accountant' | 'Dean of Studies' | 'Head Of Department' | 'Admin';
  isActive: boolean;
  hireDate: string;
  salary?: number;
  address?: {
    street: string;
    city: string;
    region: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  profilePicture?: string;
  branch: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  byType: Array<{ _id: string; count: number }>;
  byDepartment: Array<{ _id: string; count: number }>;
}

export const StaffDirectory: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { showToast } = useUI();
  
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // UI State
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<Staff | null>(null);

  // Fetch staff
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { type: filterType }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(showActiveOnly && { isActive: 'true' }),
        ...(selectedBranch && { branch: selectedBranch._id })
      });

      const response = await fetchClient.get(`/api/staff?${params}`);
      const data = await response.json();
      setStaff(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch staff');
      showToast('Failed to fetch staff', 'error');
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

      const response = await fetchClient.get(`/api/staff/stats/overview?${params}`);
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch staff statistics:', err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [page, pageSize, searchTerm, filterType, filterDepartment, showActiveOnly, selectedBranch]);

  useEffect(() => {
    fetchStats();
  }, [selectedBranch]);

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this staff member?')) {
      return;
    }

    try {
      await fetchClient.delete(`/api/staff/${staffId}`);
      showToast('Staff member deactivated successfully', 'success');
      fetchStaff();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete staff member', 'error');
    }
  };

  const handleExportStaff = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(selectedBranch && { branch: selectedBranch._id }),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { type: filterType }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(showActiveOnly && { isActive: 'true' })
      });

      const response = await fetchClient.get(`/api/staff/export?${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `staff-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Staff exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export staff', 'error');
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Lecturer': return 'bg-blue-100 text-blue-800';
      case 'Accountant': return 'bg-green-100 text-green-800';
      case 'Dean of Studies': return 'bg-purple-100 text-purple-800';
      case 'Head Of Department': return 'bg-orange-100 text-orange-800';
      case 'Admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading && staff.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-gray-600">Manage staff members and employees</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
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
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lecturers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byType.find(t => t._id === 'Lecturer')?.count || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrative</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byType.filter(t => ['Admin', 'Accountant', 'Dean of Studies', 'Head Of Department'].includes(t._id)).reduce((sum, t) => sum + t.count, 0)}
                </p>
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
                  placeholder="Search staff..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Accountant">Accountant</option>
                <option value="Dean of Studies">Dean of Studies</option>
                <option value="Head Of Department">Head of Department</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {/* This would be populated from departments API */}
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
                Show active staff only
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Staff Members ({total})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportStaff('csv')}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExportStaff('xlsx')}
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
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((staffMember) => (
                <tr key={staffMember._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {staffMember.profilePicture ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={staffMember.profilePicture}
                            alt={staffMember.names}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {staffMember.firstName[0]}{staffMember.lastName[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {staffMember.names}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {staffMember.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">{staffMember.position}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(staffMember.type)}`}>
                        {staffMember.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {formatPhone(staffMember.phoneNumber)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {staffMember.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staffMember.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(staffMember.hireDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(staffMember.isActive)}`}>
                      {staffMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStaffMember(staffMember);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStaffMember(staffMember);
                          setShowEditModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staffMember._id)}
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
      {staff.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No staff found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterType || filterDepartment
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding a new staff member.'}
          </p>
          {!searchTerm && !filterType && !filterDepartment && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Staff Member
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;