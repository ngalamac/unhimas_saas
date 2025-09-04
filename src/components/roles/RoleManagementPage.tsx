import React, { useState, useEffect } from 'react';
import fetchClient from '../../lib/fetchClient';
import { useAuth } from '../../context/AuthContext';
import { Shield, Users, Plus, Save, Trash2, Eye, Edit, UserCheck, Building2, GraduationCap, DollarSign, QrCode, BarChart3, Settings } from 'lucide-react';

type PermissionActions = { [key: string]: boolean };
type UserPermissions = { [feature: string]: PermissionActions };
type User = {
  _id: string;
  name: string;
  email: string;
  type: string;
  permissions: UserPermissions;
};

// Define all system modules based on sidebar structure with CRUD actions
const systemModules = {
  'Dashboard': {
    icon: <Eye className="w-4 h-4" />,
    actions: ['view'],
    description: 'Access to main dashboard'
  },
  'Academics': {
    icon: <GraduationCap className="w-4 h-4" />,
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Manage academic programs, departments, courses, grading'
  },
  'Students': {
    icon: <Users className="w-4 h-4" />,
    actions: ['create', 'read', 'update', 'delete', 'export'],
    description: 'Manage student records and enrollment'
  },
  'Admissions': {
    icon: <UserCheck className="w-4 h-4" />,
    actions: ['create', 'read', 'update', 'delete', 'approve'],
    description: 'Process applications and manage admissions'
  },
  'Accounting': {
    icon: <DollarSign className="w-4 h-4" />,
    actions: ['create', 'read', 'update', 'delete', 'approve', 'export'],
    description: 'Manage financial transactions and reports'
  },
  'Human Resources': {
    icon: <Users className="w-4 h-4" />,
    actions: ['create', 'read', 'update', 'delete', 'print'],
    description: 'Manage staff records, payroll, and ID cards'
  },
  'Attendance': {
    icon: <QrCode className="w-4 h-4" />,
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Manage attendance system and messaging'
  },
  'Reports & Analytics': {
    icon: <BarChart3 className="w-4 h-4" />,
    actions: ['read', 'export'],
    description: 'Access to all system reports and analytics'
  },
  'Branches': {
    icon: <Building2 className="w-4 h-4" />,
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Manage school branches and locations'
  },
  'Roles & Access': {
    icon: <Shield className="w-4 h-4" />,
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Manage user roles and permissions'
  },
  'Settings': {
    icon: <Settings className="w-4 h-4" />,
    actions: ['read', 'update'],
    description: 'System configuration and preferences'
  }
};

const RoleManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetchClient.get('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : (data.data || []));
    } catch {
      setError('Failed to fetch users');
    }
  };

  // Edit permissions for an existing user
  const handleUserPermissionChange = async (userId: string, module: string, action: string, value: boolean) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const updatedPermissions: UserPermissions = { ...user.permissions };
    const moduleKey = module.toLowerCase().replace(/\s+/g, '_');
    
    if (!updatedPermissions[moduleKey]) {
      updatedPermissions[moduleKey] = {};
    }
    
    updatedPermissions[moduleKey][action] = value;

    try {
      const res = await fetchClient.put(`/api/users/${userId}/permissions`, { permissions: updatedPermissions });
      if (res.ok) {
        setSuccess('Permissions updated! Ask the user to log out and log in again for changes to take effect.');
        fetchUsers();
      }
    } catch {
      setError('Failed to update permissions');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetchClient.delete(`/api/users/${userId}`);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch {
      setError('Failed to delete user');
    }
  };

  // Check if user has permission
  const hasPermission = (user: User, module: string, action: string): boolean => {
    if (user.type === 'SuperAdmin') return true;
    
    const moduleKey = module.toLowerCase().replace(/\s+/g, '_');
    return user.permissions?.[moduleKey]?.[action] || false;
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Role & Permission Management</h1>
        <p className="text-gray-600">Manage user roles and permissions across all system modules</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Permissions Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Permissions Matrix</h2>
          <p className="text-sm text-gray-600 mt-1">Click checkboxes to grant/revoke permissions for each user</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  User Details
                </th>
                {Object.entries(systemModules).map(([module, config]) => (
                  <th key={module} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        {config.icon}
                        <span className="text-xs">{module}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-normal">
                        {config.description}
                      </div>
                      <div className="flex flex-wrap justify-center gap-1">
                        {config.actions.map((action) => (
                          <span key={action} className="text-xs px-1 py-0.5 bg-gray-100 rounded text-gray-600">
                            {action.charAt(0).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  {/* User Details Column */}
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-orange-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                          user.type === 'SuperAdmin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.type === 'Admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.type}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Permission Columns */}
                  {Object.entries(systemModules).map(([module, config]) => (
                    <td key={module} className="px-6 py-4 whitespace-nowrap text-center">
                      {user.type === 'SuperAdmin' ? (
                        <div className="text-xs text-purple-600 font-medium">Full Access</div>
                      ) : (
                        <div className="flex flex-wrap justify-center gap-1">
                          {config.actions.map((action) => (
                            <label key={action} className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                checked={hasPermission(user, module, action)}
                                disabled={user._id === currentUser?.id}
                                title={user._id === currentUser?.id ? 'Cannot modify your own permissions' : `${action} permission for ${module}`}
                                onChange={e => handleUserPermissionChange(user._id, module, action, e.target.checked)}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50"
                              />
                              <span className="text-xs text-gray-600 mt-1 capitalize">{action}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}

                  {/* Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.type !== 'SuperAdmin' && user._id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {user._id === currentUser?.id && (
                      <span className="text-xs text-gray-400 italic">Cannot delete yourself</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Permission Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
          <div><strong>C:</strong> Create - Add new records</div>
          <div><strong>R:</strong> Read - View existing records</div>
          <div><strong>U:</strong> Update - Modify existing records</div>
          <div><strong>D:</strong> Delete - Remove records</div>
          <div><strong>A:</strong> Approve - Authorize actions</div>
          <div><strong>E:</strong> Export - Download data</div>
          <div><strong>P:</strong> Print - Generate documents</div>
          <div><strong>V:</strong> View - Access to features</div>
        </div>
      </div>

      {users.length === 0 && (
        <div className="mt-8 text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600">There are no users in the system yet.</p>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;
