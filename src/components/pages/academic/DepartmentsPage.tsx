import React, { useEffect, useState } from 'react';
import fetchClient from '../../../lib/fetchClient';
import { Building2, Plus, Edit, Trash2, Eye, Users, BookOpen } from 'lucide-react';
import { Department } from '../../../types/school';
import { getDepartments, deleteDepartment } from '../../../api/departments';

export const DepartmentsPage: React.FC = () => {
  // Modal state for create/edit/view
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [modalDepartment, setModalDepartment] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formProgramId, setFormProgramId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all programs for dropdown
    fetchClient.get('/api/programs').then(res => res.json()).then(setPrograms).catch(() => {});
  }, []);

  // Open modal for create/edit/view
  const openModal = (mode: 'create' | 'edit' | 'view', department?: Department) => {
    setModalMode(mode);
    setModalDepartment(department || null);
    if (mode === 'edit' && department) {
      setFormName(department.name);
      setFormCode(department.code || '');
      setFormProgramId((department.program as any)?._id || (department.program as any)?.id || '');
  setFormIsActive(department.isActive !== undefined ? department.isActive : true);
    } else if (mode === 'create') {
      setFormName('');
      setFormCode('');
      setFormProgramId('');
      setFormIsActive(true);
    }
  };

  // Save department (create or edit)
  const handleSaveDepartment = async () => {
    if (!formName.trim() || !formProgramId) {
      setModal({ open: true, title: 'Missing information', message: 'Name and program are required' });
      return;
    }
    try {
      if (modalMode === 'create') {
        const payload = {
          name: formName,
          code: formCode,
          program: formProgramId,
          isActive: formIsActive
        };
        const d = await fetchClient.post('/api/departments', payload).then(res => res.json());
        setDepartments(prev => [d, ...prev]);
      } else if (modalMode === 'edit' && modalDepartment) {
        const payload = {
          name: formName,
          code: formCode,
          program: formProgramId,
          isActive: formIsActive
        };
        const d = await fetchClient.put(`/api/departments/${modalDepartment._id || modalDepartment.id}`, payload).then(res => res.json());
        setDepartments(prev => prev.map(dep => (dep._id || dep.id) === (d._id || d.id) ? d : dep));
      }
      setModalMode(null);
    } catch (e) {
      setModal({ open: true, title: 'Save failed', message: 'Failed to save department' });
    }
  };

  // Modal component
  const DepartmentModal = () => {
    if (!modalMode) return null;
    const isView = modalMode === 'view';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
          <h2 className="text-xl font-bold mb-4">{modalMode === 'create' ? 'Add Department' : modalMode === 'edit' ? 'Edit Department' : 'View Department'}</h2>
          <div className="space-y-4">
            <input disabled={isView} value={formName} onChange={e => setFormName(e.target.value)} placeholder="Department Name" className="w-full px-3 py-2 border rounded" />
            <input disabled={isView} value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="Code" className="w-full px-3 py-2 border rounded" />
            <select disabled={isView} value={formProgramId} onChange={e => setFormProgramId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">Select Program</option>
              {programs.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
            </select>
            <label className="flex items-center space-x-2">
              <input disabled={isView} type="checkbox" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} />
              <span>Active</span>
            </label>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button onClick={() => setModalMode(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            {!isView && (
              <button onClick={handleSaveDepartment} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            )}
          </div>
        </div>
      </div>
    );
  };
  const [departments, setDepartments] = useState<Department[]>([]);
  // Removed unused nameRef after switching to modal-based creation

  useEffect(() => {
    getDepartments()
      .then(resp => {
        const list: any = (resp as any)?.data || resp;
        setDepartments(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // (Removed unused inline create handler in favor of modal-driven creation)

  const handleDelete = async (id?: string) => {
    if (!id) return;
    // Optimistic update with rollback if failure
    const original = departments;
    setDepartments(prev => prev.filter(d => (d._id || d.id) !== id));
    try {
      await deleteDepartment(id);
      try { (window as any).__UI_BRIDGE__?.showToast?.('Department deleted'); } catch (e) { }
    } catch (e:any) {
      // rollback
      setDepartments(original);
      try { (window as any).__UI_BRIDGE__?.showToast?.(e?.message || 'Failed to delete'); } catch (er) { }
      setModal({ open: true, title: 'Delete failed', message: 'Failed to delete department' });
    }
  };

  // edit/save flow not implemented yet for departments; update handler omitted to avoid unused symbol

  return (
    <div className="p-6">
      <DepartmentModal />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Departments</h1>
          <p className="text-gray-600">Manage all academic departments and their programs</p>
        </div>
  <button type="button" onClick={() => openModal('create')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add New Department</span>
        </button>
      </div>

      {/* Stats */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-xl font-bold text-gray-900">{departments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With HODs</p>
              <p className="text-xl font-bold text-gray-900">
                {departments.filter(d => d.hod).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-xl font-bold text-gray-900">
                {departments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department) => (
          <div key={department._id || department.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-500">Code: {department.code}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Program:</span>
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const prog = (department as any).program;
                      if (!prog) return '—';
                      if (typeof prog === 'string') return prog || '—';
                      if (typeof prog === 'object') return (prog.name || prog.code || prog._id || '—');
                      return '—';
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Students:</span>
                  <span className="font-medium text-gray-900">
                    {(department as any).studentsCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Faculty:</span>
                  <span className="font-medium text-gray-900">
                    {(department as any).facultyCount ?? 0}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Head of Department</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        const hod: any = (department as any).hod;
                        if (!hod) return 'Not Assigned';
                        if (typeof hod === 'string') return hod;
                        return hod.name || `${hod.firstName || ''} ${hod.lastName || ''}`.trim() || 'Not Assigned';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" onClick={() => openModal('view', department)} />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <Edit className="w-4 h-4" onClick={() => openModal('edit', department)} />
                  </button>
                  <button onClick={() => handleDelete(department._id || department.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-900 font-medium flex items-center space-x-1">
                  <BookOpen className="w-3 h-3" />
                  <span>View Programs</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center space-x-2">
  {/* Use modal for create instead of inline */}
  <button onClick={() => openModal('create')} className="bg-blue-600 text-white px-4 py-2 rounded">Add Department</button>
      </div>
    </div>
  );
};