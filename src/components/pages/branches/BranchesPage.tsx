import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Download, Plus, Building2, Users, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';

interface Branch {
  _id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  manager: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  establishedDate: string;
  studentCount: number;
  staffCount: number;
  description?: string;
  location?: {
    city: string;
    region: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  settings?: {
    timezone: string;
    currency: string;
    academicYear: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BranchStats {
  total: number;
  active: number;
  inactive: number;
  totalStudents: number;
  totalStaff: number;
}

export const BranchesPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { showToast } = useUI();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // UI State
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBranchForModal, setSelectedBranchForModal] = useState<Branch | null>(null);
  const [availableManagers, setAvailableManagers] = useState<Array<{_id: string; name: string; email: string}>>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Fetch available managers for branch assignment
  const fetchAvailableManagers = async () => {
    try {
      setLoadingManagers(true);
      console.log('Fetching available managers...');
      
      const response = await fetchClient.get('/api/users?type=Admin&isActive=true');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Available managers data:', data);
      
      setAvailableManagers(data.data || []);
      console.log('Available managers set:', data.data || []);
    } catch (err) {
      console.error('Failed to fetch available managers:', err);
      showToast('Failed to fetch available managers', 'error');
    } finally {
      setLoadingManagers(false);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
        ...(showActiveOnly && { isActive: 'true' })
      });

      const response = await fetchClient.get(`/api/branches?${params}`);
      const data = await response.json();
      setBranches(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch branches');
      showToast('Failed to fetch branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create new branch
  const handleCreateBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const branchData = {
        name: formData.get('name') as string,
        manager: formData.get('manager') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
        location: {
          city: formData.get('city') as string,
          region: formData.get('region') as string,
        },
        establishedDate: formData.get('establishedDate') as string,
        settings: {
          timezone: formData.get('timezone') as string,
          currency: formData.get('currency') as string,
        },
        description: formData.get('description') as string,
      };

      const response = await fetchClient.post('/api/branches', branchData);
      if (response.ok) {
        showToast('Branch created successfully!', 'success');
        setShowCreateModal(false);
        fetchBranches();
        fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to create branch', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create branch', 'error');
    }
  };

  // Edit branch
  const handleEditBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const branchData = {
        name: formData.get('name') as string,
        manager: formData.get('manager') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
        location: {
          city: formData.get('city') as string,
          region: formData.get('region') as string,
        },
        establishedDate: formData.get('establishedDate') as string,
        settings: {
          timezone: formData.get('timezone') as string,
          currency: formData.get('currency') as string,
        },
        description: formData.get('description') as string,
      };

      const branchId = formData.get('branchId') as string;
      const response = await fetchClient.put(`/api/branches/${branchId}`, branchData);
      if (response.ok) {
        showToast('Branch updated successfully!', 'success');
        setShowEditModal(false);
        fetchBranches();
        fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to update branch', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update branch', 'error');
    }
  };

  // Delete branch
  const handleDeleteBranch = async (branchId: string) => {
    if (!window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetchClient.delete(`/api/branches/${branchId}`);
      if (response.ok) {
        showToast('Branch deleted successfully!', 'success');
        fetchBranches();
        fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to delete branch', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete branch', 'error');
    }
  };

  // Export branches
  const handleExportBranches = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await fetchClient.get(`/api/branches/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `branches.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast(`Branches exported as ${format.toUpperCase()} successfully!`, 'success');
      }
    } catch (err: any) {
      showToast('Failed to export branches', 'error');
    }
  };

  // Get status color
  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetchClient.get('/api/branches/stats/overview');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch branch statistics:', err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchStats();
    fetchAvailableManagers();
  }, [page, pageSize, searchTerm, filterStatus, showActiveOnly]);

  // Test backend connectivity
  useEffect(() => {
    const testBackend = async () => {
      try {
        console.log('Testing backend connectivity...');
        const response = await fetch('/api/health');
        console.log('Backend health check:', response.status);
      } catch (err) {
        console.error('Backend not accessible:', err);
      }
    };
    testBackend();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && branches.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Branches Management</h1>
          <p className="text-gray-600">Manage school branches and locations</p>
        </div>
        {user?.type === 'SuperAdmin' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Branch</span>
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Branches</p>
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
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
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
                  placeholder="Search branches..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                Show active branches only
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Branches ({total})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportBranches('csv')}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExportBranches('xlsx')}
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
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistics
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
              {branches.map((branch) => (
                <tr key={branch._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {branch.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {branch.location?.city}, {branch.location?.region}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{branch.manager?.name}</div>
                    <div className="text-sm text-gray-500">{branch.manager?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {branch.phoneNumber}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {branch.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {branch.studentCount} students
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {branch.staffCount} staff
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(branch.isActive)}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBranchForModal(branch);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user?.type === 'SuperAdmin' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBranchForModal(branch);
                              setShowEditModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(branch._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
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
      {branches.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No branches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding a new branch.'}
          </p>
          {!searchTerm && !filterStatus && user?.type === 'SuperAdmin' && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Branch
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Branch</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter branch name"
                  />
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Branch Manager *
                   </label>
                   <select
                     name="manager"
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                     disabled={availableManagers.length === 0}
                   >
                     <option value="">
                       {loadingManagers 
                         ? 'Loading managers...' 
                         : availableManagers.length === 0 
                           ? 'No Admin users available' 
                           : 'Select a branch manager'
                       }
                     </option>
                     {availableManagers.map((manager) => (
                       <option key={manager._id} value={manager._id}>
                         {manager.name} ({manager.email})
                       </option>
                     ))}
                   </select>
                   {availableManagers.length === 0 && (
                     <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                       <p className="text-sm text-orange-800 font-medium mb-1">
                         No Branch Managers Available
                       </p>
                       <p className="text-sm text-orange-700">
                         You need to create users with the "Admin" role first before creating branches.
                       </p>
                       <div className="mt-2 flex space-x-3">
                         <button
                           type="button"
                           onClick={() => {
                             setShowCreateModal(false);
                             // Navigate to user management page
                             window.location.href = '/roles';
                           }}
                           className="text-sm text-orange-700 hover:text-orange-900 underline"
                         >
                           Go to User Management →
                         </button>
                         <button
                           type="button"
                           onClick={fetchAvailableManagers}
                           className="text-sm text-orange-700 hover:text-orange-900 underline"
                         >
                           Refresh Managers
                         </button>
                       </div>
                     </div>
                   )}
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    name="region"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter region/state"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Established Date
                  </label>
                  <input
                    type="date"
                    name="establishedDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="UTC+1">UTC+1</option>
                    <option value="UTC+2">UTC+2</option>
                    <option value="UTC+3">UTC+3</option>
                    <option value="UTC+4">UTC+4</option>
                    <option value="UTC+5">UTC+5</option>
                    <option value="UTC+6">UTC+6</option>
                    <option value="UTC+7">UTC+7</option>
                    <option value="UTC+8">UTC+8</option>
                    <option value="UTC+9">UTC+9</option>
                    <option value="UTC+10">UTC+10</option>
                    <option value="UTC+11">UTC+11</option>
                    <option value="UTC+12">UTC+12</option>
                    <option value="UTC-1">UTC-1</option>
                    <option value="UTC-2">UTC-2</option>
                    <option value="UTC-3">UTC-3</option>
                    <option value="UTC-4">UTC-4</option>
                    <option value="UTC-5">UTC-5</option>
                    <option value="UTC-6">UTC-6</option>
                    <option value="UTC-7">UTC-7</option>
                    <option value="UTC-8">UTC-8</option>
                    <option value="UTC-9">UTC-9</option>
                    <option value="UTC-10">UTC-10</option>
                    <option value="UTC-11">UTC-11</option>
                    <option value="UTC-12">UTC-12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter branch description"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && selectedBranchForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Branch</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditBranch} className="space-y-6">
              <input type="hidden" name="branchId" value={selectedBranchForModal._id} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedBranchForModal.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Manager *
                  </label>
                  <select
                    name="manager"
                    defaultValue={selectedBranchForModal.manager._id}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {availableManagers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name} ({manager.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    defaultValue={selectedBranchForModal.phoneNumber}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedBranchForModal.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    defaultValue={selectedBranchForModal.address}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={selectedBranchForModal.location?.city || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    name="region"
                    defaultValue={selectedBranchForModal.location?.region || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Established Date
                  </label>
                  <input
                    type="date"
                    name="establishedDate"
                    defaultValue={selectedBranchForModal.establishedDate?.split('T')[0] || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    defaultValue={selectedBranchForModal.settings?.timezone || 'UTC'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="UTC+1">UTC+1</option>
                    <option value="UTC+2">UTC+2</option>
                    <option value="UTC+3">UTC+3</option>
                    <option value="UTC+4">UTC+4</option>
                    <option value="UTC+5">UTC+5</option>
                    <option value="UTC+6">UTC+6</option>
                    <option value="UTC+7">UTC+7</option>
                    <option value="UTC+8">UTC+8</option>
                    <option value="UTC+9">UTC+9</option>
                    <option value="UTC+10">UTC+10</option>
                    <option value="UTC+11">UTC+11</option>
                    <option value="UTC+12">UTC+12</option>
                    <option value="UTC-1">UTC-1</option>
                    <option value="UTC-2">UTC-2</option>
                    <option value="UTC-3">UTC-3</option>
                    <option value="UTC-4">UTC-4</option>
                    <option value="UTC-5">UTC-5</option>
                    <option value="UTC-6">UTC-6</option>
                    <option value="UTC-7">UTC-7</option>
                    <option value="UTC-8">UTC-8</option>
                    <option value="UTC-9">UTC-9</option>
                    <option value="UTC-10">UTC-10</option>
                    <option value="UTC-11">UTC-11</option>
                    <option value="UTC-12">UTC-12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    defaultValue={selectedBranchForModal.settings?.currency || 'USD'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={selectedBranchForModal.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Update Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Branch Modal */}
      {showViewModal && selectedBranchForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Branch Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.manager.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.email || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.location?.city || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.location?.region || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Established</label>
                  <p className="text-sm text-gray-900">{new Date(selectedBranchForModal.establishedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBranchForModal.isActive)}`}>
                    {selectedBranchForModal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Students</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.studentCount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Staff</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.staffCount}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-sm text-gray-900">{selectedBranchForModal.description || 'No description provided'}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchesPage;
