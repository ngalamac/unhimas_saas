import React, { useEffect, useState } from 'react';
import fetchClient from '../../../lib/fetchClient';
import { Building2, Plus, Edit, Trash2, Eye, Users, BookOpen, GraduationCap } from 'lucide-react';
import { Department } from '../../../types/school'; // Re-use for now, can be specialized

interface Specialty {
    _id: string;
    id?: string;
    name: string;
    department: Department | string;
    createdBy?: any;
    createdAt?: string;
}

export const SpecialtiesPage: React.FC = () => {
  // Modal state for create/edit/view
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [modalSpecialty, setModalSpecialty] = useState<Specialty | null>(null);
  const [formName, setFormName] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    // Fetch all departments for dropdown
    fetchClient.get('/api/departments').then(res => res.json()).then(setDepartments).catch(() => {});
    // Fetch all specialties
    fetchClient.get('/api/specialties').then(res => res.json()).then(setSpecialties).catch(() => {});
  }, []);

  // Open modal for create/edit/view
  const openModal = (mode: 'create' | 'edit' | 'view', specialty?: Specialty) => {
    setModalMode(mode);
    setModalSpecialty(specialty || null);
    if (mode === 'edit' && specialty) {
      setFormName(specialty.name);
      setFormDepartmentId((specialty.department as any)?._id || specialty.department);
    } else if (mode === 'create') {
      setFormName('');
      setFormDepartmentId('');
    }
  };

  // Save specialty (create or edit)
  const handleSaveSpecialty = async () => {
    if (!formName.trim() || !formDepartmentId) {
      alert('Name and department are required');
      return;
    }
    try {
      if (modalMode === 'create') {
        const payload = { name: formName, department: formDepartmentId };
        const newSpecialty = await fetchClient.post('/api/specialties', payload).then(res => res.json());
        setSpecialties(prev => [newSpecialty, ...prev]);
      } else if (modalMode === 'edit' && modalSpecialty) {
        const payload = { name: formName, department: formDepartmentId };
        const updatedSpecialty = await fetchClient.put(`/api/specialties/${modalSpecialty._id || modalSpecialty.id}`, payload).then(res => res.json());
        setSpecialties(prev => prev.map(spec => (spec._id || spec.id) === (updatedSpecialty._id || updatedSpecialty.id) ? updatedSpecialty : spec));
      }
      setModalMode(null);
    } catch (e) {
      alert('Failed to save specialty');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm("Are you sure you want to delete this specialty?")) return;
    try {
        await fetchClient.delete(`/api/specialties/${id}`);
        setSpecialties(prev => prev.filter(s => (s._id || s.id) !== id));
    } catch (e) {
        alert('Failed to delete specialty');
    }
  };

  // Modal component
  const SpecialtyModal = () => {
    if (!modalMode) return null;
    const isView = modalMode === 'view';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
          <h2 className="text-xl font-bold mb-4">{modalMode === 'create' ? 'Add Specialty' : modalMode === 'edit' ? 'Edit Specialty' : 'View Specialty'}</h2>
          <div className="space-y-4">
            <input disabled={isView} value={formName} onChange={e => setFormName(e.target.value)} placeholder="Specialty Name" className="w-full px-3 py-2 border rounded" />
            <select disabled={isView} value={formDepartmentId} onChange={e => setFormDepartmentId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button onClick={() => setModalMode(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            {!isView && (
              <button onClick={handleSaveSpecialty} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <SpecialtyModal />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Specialties</h1>
          <p className="text-gray-600">Manage all academic specialties within departments</p>
        </div>
        <button onClick={() => openModal('create')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add New Specialty</span>
        </button>
      </div>

      {/* Specialties Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {specialties.map((specialty) => (
                    <tr key={specialty._id || specialty.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                    <GraduationCap className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="font-medium text-gray-900">{specialty.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {typeof specialty.department === 'object' ? specialty.department.name : specialty.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(specialty.createdAt || '').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-4">
                                <button onClick={() => openModal('edit', specialty)} className="text-blue-600 hover:text-blue-900">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(specialty._id || specialty.id)} className="text-red-600 hover:text-red-900">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
