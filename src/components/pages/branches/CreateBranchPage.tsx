import React, { useState } from 'react';
import { createBranch } from '../../../api/branches';
import { Branch } from '../../../types/school';
import { Save, Building2 } from 'lucide-react';

export const CreateBranchPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    managerId: '',
    establishedDate: ''
  });
  const [managers, setManagers] = useState<any[]>([]);

  // Fetch managers (admins) from API
  React.useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await fetch('/api/users?type=Admin');
        const data = await res.json();
        setManagers(Array.isArray(data) ? data : []);
      } catch {
        setManagers([]);
      }
    };
    fetchManagers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus({ status: 'loading', message: 'Creating branch...' });
    try {
      const created: Branch = await createBranch({
        name: formData.name,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        manager: { id: formData.managerId, _id: formData.managerId, name: '' } as any,
        establishedDate: formData.establishedDate,
      });
      try { window.dispatchEvent(new CustomEvent('branch:created', { detail: created })); } catch {}
      setCreateStatus({ status: 'success', message: 'Branch created successfully.' });
      setFormData({ name: '', address: '', phoneNumber: '', email: '', managerId: '', establishedDate: '' });
    } catch (err: any) {
      const message = err?.message || 'Failed to create branch';
      setCreateStatus({ status: 'error', message });
    }
  };

  // Create status modal state
  const [createStatus, setCreateStatus] = React.useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Branch</h1>
        <p className="text-gray-600">Add a new branch location to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Branch Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Branch Information</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., UNHIMAS Douala Branch"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              placeholder="Complete address including city and region"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+237 2XX XXX XXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="branch@unhimas.edu.cm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Manager *</label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Manager</option>
                {managers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.firstName || manager.name} {manager.lastName || ''} - {manager.type || manager.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Established Date *</label>
              <input
                type="date"
                name="establishedDate"
                value={formData.establishedDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Create Branch</span>
          </button>
        </div>
      </form>

        {/* Create status modal */}
        {createStatus.status !== 'idle' && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {createStatus.status === 'loading'
                    ? 'Creating...'
                    : createStatus.status === 'success'
                    ? 'Success'
                    : 'Error'}
                </h3>
                <p className="text-gray-600 mb-4">{createStatus.message}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setCreateStatus({ status: 'idle', message: '' })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};