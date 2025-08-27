import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Program } from '../../../types/school';
import { getPrograms, createProgram, deleteProgram, updateProgram } from '../../../api/programs';

export const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'Undergraduate' | 'Postgraduate'>('Undergraduate');
  const [subType, setSubType] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState<Program | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadPrograms(); }, []);

  const loadPrograms = async () => {
    try {
      const res = await getPrograms();
      setPrograms(res || []);
    } catch (err) {
      console.error('Failed to load programs', err);
    }
  };

  const clearForm = () => { setName(''); setType('Undergraduate'); setSubType(''); };

  const openCreate = () => { clearForm(); setIsEditing(null); setShowModal(true); };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const created = await createProgram({ name, type, subType: subType || undefined });
      setPrograms(prev => [created, ...prev]);
      setShowModal(false);
      clearForm();
    } catch (err) {
      console.error('Create failed', err);
      alert('Failed to create program');
    }
    setLoading(false);
  };

  const handleEdit = (p: Program) => {
    setIsEditing(p);
    setName(p.name);
    setType((p.type as any) || 'Undergraduate');
    setSubType((p as any).subType || '');
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    if (!isEditing) return;
    setLoading(true);
    try {
      const id = isEditing._id || (isEditing as any).id;
      const updated = await updateProgram(id, { name, type, subType: subType || undefined });
      setPrograms(prev => prev.map(p => (p._id === updated._id ? updated : p)));
      setIsEditing(null);
      setShowModal(false);
      clearForm();
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update program');
    }
    setLoading(false);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this program?')) return;
    try {
      await deleteProgram(id);
      setPrograms(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete program');
    }
  };

  const filtered = programs.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Programs</h2>
          <p className="text-sm text-gray-500">Manage academic programs</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search programs..."
              className="pl-10 pr-3 py-2 border rounded"
            />
          </div>
          <button onClick={openCreate} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p._id || (p as any).id} className="bg-white p-4 rounded shadow border flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.type}{(p as any).subType ? ` • ${(p as any).subType}` : ''}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800"><Edit /></button>
                <button onClick={() => handleDelete(p._id || (p as any).id)} className="text-red-600 hover:text-red-800"><Trash2 /></button>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">Duration: {p.duration ?? '—'} years • Semesters/yr: {p.semestersPerYear ?? '—'}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Program' : 'Create Program'}</h3>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Program name" className="w-full border px-3 py-2 rounded" />
              <div className="flex space-x-2">
                <select value={type} onChange={e => setType(e.target.value as any)} className="border px-3 py-2 rounded w-1/2">
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
                <input value={subType} onChange={e => setSubType(e.target.value)} placeholder="Subtype (optional)" className="border px-3 py-2 rounded w-1/2" />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => { setShowModal(false); clearForm(); setIsEditing(null); }} className="px-3 py-2 rounded border">Cancel</button>
              {isEditing ? (
                <button onClick={handleSaveEdit} disabled={loading} className="bg-blue-600 text-white px-3 py-2 rounded">Save</button>
              ) : (
                <button onClick={handleCreate} disabled={loading} className="bg-blue-600 text-white px-3 py-2 rounded">Create</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;