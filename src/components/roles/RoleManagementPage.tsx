import React, { useState, useEffect } from 'react';

type PermissionActions = { [key: string]: boolean };
type UserPermissions = { [feature: string]: PermissionActions };
type User = {
  _id: string;
  name: string;
  email: string;
  type: string;
  permissions: UserPermissions;
};
// ...existing code...

const features: { [key: string]: string[] } = {
  Students: ['create', 'read', 'update', 'delete', 'approve', 'assign'],
  Fees: ['create', 'read', 'update', 'delete'],
  Transactions: ['create', 'read', 'update', 'delete', 'export'],
  Reports: ['read', 'export'],
};

const RoleManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  // Helper to generate default permissions
  const getDefaultPermissions = (): UserPermissions => {
    const perms: UserPermissions = {};
    Object.keys(features).forEach((feature) => {
      const normalizedFeature = feature.toLowerCase();
      perms[normalizedFeature] = {};
      features[feature].forEach((action) => {
        perms[normalizedFeature][action] = false;
      });
    });
    return perms;
  };
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    type: '',
    permissions: getDefaultPermissions(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const data = await res.json();
      setUsers(data);
    } catch {
      setError('Failed to fetch users');
    }
  };

  // Edit permissions for an existing user
  const handleUserPermissionChange = async (userId: string, feature: string, action: string, value: boolean) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    // Defensive: ensure feature exists
    const updatedPermissions: UserPermissions = { ...user.permissions };
    const normalizedFeature = feature.toLowerCase();
    if (!updatedPermissions[normalizedFeature]) {
      updatedPermissions[normalizedFeature] = {};
      features[feature].forEach((a) => {
        updatedPermissions[normalizedFeature][a] = false;
      });
    }
    updatedPermissions[normalizedFeature][action] = value;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions }),
      });
      if (res.ok) {
        setSuccess('Permissions updated! Ask the user to log out and log in again for changes to take effect.');
      }
      fetchUsers();
    } catch {
      setError('Failed to update permissions');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
      });
      fetchUsers();
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    // Always send initialized permissions
    const userPayload = {
      ...form,
      permissions: getDefaultPermissions(),
    };
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      });
      if (res.ok) {
        setSuccess('User created successfully');
        setForm({ name: '', email: '', password: '', type: '', permissions: getDefaultPermissions() });
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create user');
      }
    } catch {
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Role & Permission Management</h2>
      {/* User creation form */}
      <form onSubmit={handleCreateUser} className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <input type="text" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="p-2 border rounded" />
        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="p-2 border rounded" />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className="p-2 border rounded" />
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required className="p-2 border rounded">
          <option value="">Select Type</option>
          <option value="SuperAdmin">Super Admin</option>
          <option value="Admin">Admin</option>
          <option value="Registrar">Registrar</option>
          <option value="Accountant">Accountant</option>
          <option value="Dean">Dean of Studies</option>
          <option value="HOD">Head Of Department</option>
        </select>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Creating...' : 'Create User'}</button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 p-2 border rounded w-full"
      />
      <table className="min-w-full bg-white border rounded shadow">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Type</th>
            {Object.keys(features).map((feature) => (
              <th key={feature} className="py-2 px-4 border-b text-center">
                {feature}
                <div className="flex justify-center space-x-1 text-xs mt-1">
                  {features[feature].map((action: string) => (
                    <span key={action} className="px-1">{action.charAt(0).toUpperCase()}</span>
                  ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user._id}>
              <td className="py-2 px-4 border-b">{user.name}</td>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">{user.type}</td>
              {Object.keys(features).map((feature) => (
                <td key={feature} className="py-2 px-4 border-b text-center">
                  <div className="flex justify-center space-x-1">
                    {features[feature].map((action: string) => (
                      <label key={action} className="flex flex-col items-center">
                        <input
                          type="checkbox"
                          checked={user.type === 'SuperAdmin' ? true : user.permissions?.[feature]?.[action] || false}
                          disabled={user.type === 'SuperAdmin'}
                          onChange={e => handleUserPermissionChange(user._id, feature, action, e.target.checked)}
                        />
                        <span className="text-xs">{action.charAt(0).toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </td>
              ))}
              <td className="py-2 px-4 border-b text-center">
                {user.type !== 'SuperAdmin' && (
                  <button onClick={() => handleDeleteUser(user._id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-sm text-gray-600">
        <strong>Legend:</strong> C = Create, R = Read, U = Update, D = Delete, A = Approve, E = Export, S = Assign
      </div>
    </div>
  );
};

export default RoleManagementPage;
