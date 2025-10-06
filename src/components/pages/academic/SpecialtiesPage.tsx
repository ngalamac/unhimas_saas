import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { listSpecialties, createSpecialty, updateSpecialty, deleteSpecialty, Specialty } from '../../../api/specialties';
import fetchClient from '../../../lib/fetchClient';
import { useUI } from '../../../context/UIContext';

const SpecialtiesPage: React.FC = () => {
  const { showToast } = useUI();
  const [items, setItems] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterProgram, setFilterProgram] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [name, setName] = useState('');
  const [programId, setProgramId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await listSpecialties({ search, program: filterProgram || undefined, department: filterDepartment || undefined });
      setItems(res.data || []);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load specialties', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const res = await fetchClient.get('/api/programs');
      const data = await res.json();
      setPrograms(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadDepartments = async (prog?: string) => {
    try {
      const qs = prog ? `?program=${encodeURIComponent(prog)}` : '';
      const res = await fetchClient.get(`/api/departments${qs}`);
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => { loadDepartments(filterProgram); }, [filterProgram]);
  useEffect(() => { load(); }, [search, filterProgram, filterDepartment]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setProgramId(filterProgram || '');
    setDepartmentId(filterDepartment || '');
    setModalOpen(true);
  };

  const openEdit = (sp: Specialty) => {
    setEditing(sp);
    setName(sp.name);
    setProgramId((sp as any).program?._id || (sp as any).program || '');
    setDepartmentId((sp as any).department?._id || (sp as any).department || '');
    setModalOpen(true);
  };

  const save = async () => {
    try {
      if (!name || !programId || !departmentId) {
        showToast('Name, program and department are required', 'warning');
        return;
      }
      if (editing && editing._id) {
        await updateSpecialty(editing._id, { name, program: programId, department: departmentId });
        showToast('Specialty updated', 'success');
      } else {
        await createSpecialty({ name, program: programId, department: departmentId });
        showToast('Specialty created', 'success');
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      showToast(e?.message || 'Save failed', 'error');
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string }>({ open: false });
  const remove = async (sp: Specialty) => {
    if (!sp._id && !(sp as any).id) return;
    setConfirmDelete({ open: true, id: (sp._id || (sp as any).id) as string });
  };
  const doDelete = async (id: string) => {
    try {
      await deleteSpecialty(id);
      showToast('Specialty deleted', 'success');
      load();
    } catch (e: any) {
      showToast(e?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Specialties</h1>
        <button onClick={openCreate} className="btn inline-flex items-center"><Plus className="w-4 h-4 mr-2" />New Specialty</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm text-gray-600 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-8" placeholder="name, email or phone" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Program</label>
          <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="select min-w-[200px]">
            <option value="">All Programs</option>
            {programs.map((p: any) => (
              <option key={(p._id || p.id)} value={(p._id || p.id)}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Department</label>
          <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="select min-w-[200px]">
            <option value="">All Departments</option>
            {departments.map((d: any) => (
              <option key={(d._id || d.id)} value={(d._id || d.id)}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((sp) => (
                <tr key={(sp._id || (sp as any).id) as string}>
                  <td className="px-6 py-4 text-sm text-gray-900">{sp.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{(sp as any).program?.name || (sp as any).program}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{(sp as any).department?.name || (sp as any).department}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => openEdit(sp)} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => remove(sp)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">No specialties found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Specialty' : 'New Specialty'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="e.g., Software Engineering" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Program</label>
                <select value={programId} onChange={(e) => { setProgramId(e.target.value); setDepartmentId(''); loadDepartments(e.target.value); }} className="select w-full">
                  <option value="">Select program</option>
                  {programs.map((p: any) => (
                    <option key={(p._id || p.id)} value={(p._id || p.id)}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Department</label>
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="select w-full">
                  <option value="">Select department</option>
                  {departments.map((d: any) => (
                    <option key={(d._id || d.id)} value={(d._id || d.id)}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="btn">Cancel</button>
              <button onClick={save} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete.open && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete specialty</h3>
            <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete this specialty?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete({ open: false })} className="btn">Cancel</button>
              <button onClick={() => { const id = confirmDelete.id!; setConfirmDelete({ open: false }); doDelete(id); }} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtiesPage;
