import React, { useState } from 'react';
import { Shield, Users, Plus, Edit, Trash2, Eye, UserCheck } from 'lucide-react';
import { Role, Permission } from '../../../types/school';

export const RolePermissionPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [permissions] = useState<Permission[]>(mockPermissions);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const getRolePermissions = (role: Role) => {
    if (role.permissions.includes('all')) {
      return permissions;
    }
    return permissions.filter(p => role.permissions.includes(p.name));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="text-gray-600">Manage user roles and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">System Roles</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedRole?.id === role.id ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {role.permissions.includes('all') ? 'All Permissions' : `${role.permissions.length} permissions`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      {role.name !== 'SuperAdmin' && (
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Details & Permissions */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="space-y-6">
              {/* Role Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedRole.name}</h2>
                    <p className="text-gray-600">{selectedRole.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Role ID</p>
                    <p className="font-medium text-gray-900">{selectedRole.id}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Permissions</p>
                    <p className="font-medium text-gray-900">
                      {selectedRole.permissions.includes('all') ? 'All' : selectedRole.permissions.length}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Users</p>
                    <p className="font-medium text-gray-900">
                      {selectedRole.name === 'SuperAdmin' ? 1 : Math.floor(Math.random() * 20) + 1}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                </div>
                <div className="p-6">
                  {selectedRole.permissions.includes('all') ? (
                    <div className="text-center py-8">
                      <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Full Access</h3>
                      <p className="text-gray-600">This role has access to all system features and permissions.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getRolePermissions(selectedRole).map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{permission.name.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Role</h3>
              <p className="text-gray-600">Choose a role from the list to view its details and permissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Roles</p>
              <p className="text-xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Permissions</p>
              <p className="text-xl font-bold text-gray-900">{permissions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-xl font-bold text-gray-900">89</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Custom Roles</p>
              <p className="text-xl font-bold text-gray-900">
                {roles.filter(r => !['SuperAdmin', 'Admin', 'Lecturer'].includes(r.name)).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};