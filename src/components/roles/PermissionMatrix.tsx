import React, { useState, useEffect } from 'react';
import { Shield, Users, Eye, Edit, Save, X, Check, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import fetchClient from '../../lib/fetchClient';
import { normalizePermissions, dispatchPermissionsUpdated } from '../../utils/permissions';

interface Permission {
  feature: string;
  actions: string[];
  description: string;
  category: string;
  icon: React.ReactNode;
}

interface User {
  _id: string;
  name: string;
  email: string;
  type: string;
  permissions: Record<string, Record<string, boolean>>;
  branch?: { name: string };
  isActive: boolean;
}

const systemPermissions: Permission[] = [
  {
    feature: 'dashboard',
    actions: ['view'],
    description: 'Access to main dashboard and overview',
    category: 'Core',
    icon: <Eye className="w-4 h-4" />
  },
  {
    feature: 'students',
    actions: ['create', 'read', 'update', 'delete', 'export', 'restore'],
    description: 'Manage student records and enrollment',
    category: 'Academic',
    icon: <Users className="w-4 h-4" />
  },
  {
    feature: 'accounting',
    actions: ['create', 'read', 'update', 'delete', 'approve', 'export'],
    description: 'Financial transactions and accounting',
    category: 'Financial',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'staff',
    actions: ['create', 'read', 'update', 'delete', 'export'],
    description: 'Staff and employee management',
    category: 'HR',
    icon: <Users className="w-4 h-4" />
  },
  {
    feature: 'branches',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Branch management and oversight',
    category: 'Administrative',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'programs',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Academic programs and curriculum',
    category: 'Academic',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'departments',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Department structure and management',
    category: 'Academic',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'courses',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Course management and scheduling',
    category: 'Academic',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'grades',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Student grades and assessments',
    category: 'Academic',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'attendance',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Attendance tracking and QR codes',
    category: 'Academic',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'communication',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Announcements and messaging',
    category: 'Communication',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'reports',
    actions: ['read', 'export'],
    description: 'System reports and analytics',
    category: 'Analytics',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'users',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
    description: 'User account management',
    category: 'Security',
    icon: <Shield className="w-4 h-4" />
  },
  {
    feature: 'roles',
    actions: ['create', 'read', 'update', 'delete', 'assign'],
    description: 'Role and permission management',
    category: 'Security',
    icon: <Shield className="w-4 h-4" />
  }
];

const PermissionMatrix: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useUI();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const categories = ['All', ...Array.from(new Set(systemPermissions.map(p => p.category)))];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchClient.get('/api/users?limit=100');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermission = async (userId: string, feature: string, action: string, value: boolean) => {
    if (userId === currentUser?.id) {
      showToast('Cannot modify your own permissions', 'warning');
      return;
    }

    try {
      setSaving(`${userId}-${feature}-${action}`);
      
      const user = users.find(u => u._id === userId);
      if (!user) return;

      // Clone and mutate then normalize (drops any false/empty remnants)
      const updatedPermissions = { ...user.permissions } as Record<string, Record<string, boolean>>;
      if (!updatedPermissions[feature]) {
        updatedPermissions[feature] = {};
      }
      updatedPermissions[feature][action] = value;
      const normalized = normalizePermissions(updatedPermissions);

      const response = await fetchClient.put(`/api/users/${userId}/permissions`, {
        permissions: normalized,
        replace: true
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u._id === userId 
            ? { ...u, permissions: normalized }
            : u
        ));
        showToast('Permission updated successfully', 'success');
        dispatchPermissionsUpdated({ userId });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update permission');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update permission', 'error');
    } finally {
      setSaving(null);
    }
  };

  const hasPermission = (user: User, feature: string, action: string): boolean => {
    if (user.type === 'SuperAdmin') return true;
    return user.permissions?.[feature]?.[action] || false;
  };

  const filteredPermissions = systemPermissions.filter(permission => {
    const matchesCategory = selectedCategory === 'All' || permission.category === selectedCategory;
    const matchesSearch = permission.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'SuperAdmin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Lecturer': return 'bg-green-100 text-green-800 border-green-200';
      case 'Accountant': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Dean of Studies': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Head Of Department':
      case 'Head of Department':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Permission Matrix</h2>
          <p className="text-gray-600 mt-1">Manage detailed permissions for each user</p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center space-x-2"
        >
          <Info className="w-4 h-4" />
          <span>Help</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users or permissions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">User Permissions</h3>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} users × {filteredPermissions.length} features
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 z-10">
                  User
                </th>
                {filteredPermissions.map((permission) => (
                  <th key={permission.feature} className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] border-r border-gray-200">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        {permission.icon}
                        <span>{permission.feature}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-normal normal-case">
                        {permission.description}
                      </div>
                      <div className="flex flex-wrap justify-center gap-1">
                        {permission.actions.map((action) => (
                          <span key={action} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white px-6 py-4 border-r border-gray-200 z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.type)}`}>
                            {user.type}
                          </span>
                        </div>
                        {user.branch && (
                          <div className="text-xs text-gray-400 mt-1">{user.branch.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {filteredPermissions.map((permission) => (
                    <td key={permission.feature} className="px-4 py-4 text-center border-r border-gray-200">
                      {user.type === 'SuperAdmin' ? (
                        <div className="flex flex-col items-center space-y-1">
                          <div className="text-xs text-purple-600 font-medium">Full Access</div>
                          <div className="flex space-x-1">
                            {permission.actions.map((action) => (
                              <Check key={action} className="w-3 h-3 text-purple-600" />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {permission.actions.map((action) => {
                            const isChecked = hasPermission(user, permission.feature, action);
                            const isLoading = saving === `${user._id}-${permission.feature}-${action}`;
                            
                            return (
                              <div key={action} className="flex flex-col items-center space-y-1">
                                <button
                                  onClick={() => updateUserPermission(user._id, permission.feature, action, !isChecked)}
                                  disabled={user._id === currentUser?.id || isLoading || !user.isActive}
                                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                    isChecked 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                      : 'bg-white border-gray-300 hover:border-gray-400'
                                  } ${
                                    user._id === currentUser?.id || !user.isActive
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'cursor-pointer'
                                  }`}
                                  title={`${action} permission for ${permission.feature}`}
                                >
                                  {isLoading ? (
                                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  ) : isChecked ? (
                                    <Check className="w-3 h-3" />
                                  ) : null}
                                </button>
                                <span className="text-xs text-gray-600 capitalize">{action}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Permission Matrix Help</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How to Use</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click checkboxes to grant or revoke specific permissions</li>
                  <li>• SuperAdmin users have full access to all features</li>
                  <li>• You cannot modify your own permissions</li>
                  <li>• Changes are saved automatically</li>
                  <li>• Users must log out and back in for changes to take effect</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Permission Actions</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><strong>Create:</strong> Add new records</div>
                  <div><strong>Read:</strong> View existing records</div>
                  <div><strong>Update:</strong> Modify existing records</div>
                  <div><strong>Delete:</strong> Remove records</div>
                  <div><strong>Export:</strong> Download data</div>
                  <div><strong>Approve:</strong> Authorize actions</div>
                  <div><strong>Manage:</strong> Full management access</div>
                  <div><strong>Restore:</strong> Restore deleted items</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  {categories.filter(c => c !== 'All').map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'No users available to manage permissions.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PermissionMatrix;