import React, { useState } from 'react';
import { Building2, MapPin, Phone, Mail, Eye, Edit, Trash2, Plus, Search, Filter, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { mockBranches } from '../../../data/mockData';
import { Branch } from '../../../types/school';

export const AllBranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && branch.isActive) ||
                         (filterStatus === 'inactive' && !branch.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const handleDeleteBranch = (branchId: string) => {
    setBranchToDelete(branchId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (branchToDelete) {
      setBranches(prev => prev.filter(b => b.id !== branchToDelete));
      setShowDeleteModal(false);
      setBranchToDelete(null);
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setBranchToEdit(branch);
    setShowEditModal(true);
  };

  const toggleBranchStatus = (branchId: string) => {
    setBranches(prev => prev.map(branch => 
      branch.id === branchId 
        ? { ...branch, isActive: !branch.isActive }
        : branch
    ));
  };

  const handleViewDetails = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    alert(`Viewing details for ${branch?.name}`);
  };

  const handleManageData = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    alert(`Managing data for ${branch?.name}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Branches</h1>
          <p className="text-gray-600">Manage all school branches and locations</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add New Branch</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Branches</p>
              <p className="text-xl font-bold text-gray-900">{branches.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Branches</p>
              <p className="text-xl font-bold text-gray-900">{branches.filter(b => b.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive Branches</p>
              <p className="text-xl font-bold text-gray-900">{branches.filter(b => !b.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-xl font-bold text-gray-900">{branches.reduce((sum, b) => sum + b.studentCount, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Bulk Actions</span>
          </button>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(branch.isActive)}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleBranchStatus(branch.id)}
                  className="text-gray-400 hover:text-gray-600"
                  title={branch.isActive ? 'Deactivate Branch' : 'Activate Branch'}
                >
                  {branch.isActive ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{branch.phoneNumber}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{branch.email}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{branch.studentCount}</p>
                    <p className="text-xs text-gray-600">Students</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{branch.staffCount}</p>
                    <p className="text-xs text-gray-600">Staff</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Manager</p>
                    <p className="text-sm font-medium text-gray-900">
                      {branch.manager.firstName} {branch.manager.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Established</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(branch.establishedDate).getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleViewDetails(branch.id)}
                    className="text-blue-600 hover:text-blue-900" 
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEditBranch(branch)}
                    className="text-green-600 hover:text-green-900" 
                    title="Edit Branch"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="text-red-600 hover:text-red-900" 
                    title="Delete Branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => handleManageData(branch.id)}
                  className="text-sm text-blue-600 hover:text-blue-900 font-medium flex items-center space-x-1"
                >
                  <Building2 className="w-3 h-3" />
                  <span>Manage Data</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this branch? This action cannot be undone and will affect all associated data.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && branchToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Branch</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                <input
                  type="text"
                  defaultValue={branchToEdit.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  defaultValue={branchToEdit.address}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    defaultValue={branchToEdit.phoneNumber}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={branchToEdit.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student Count</label>
                  <input
                    type="number"
                    defaultValue={branchToEdit.studentCount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Staff Count</label>
                  <input
                    type="number"
                    defaultValue={branchToEdit.staffCount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  defaultValue={branchToEdit.isActive ? 'active' : 'inactive'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Branch updated successfully!');
                  setShowEditModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};