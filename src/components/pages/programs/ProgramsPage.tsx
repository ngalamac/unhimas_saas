import React, { useEffect, useState } from 'react';
import { getPrograms, createProgram, deleteProgram } from '../../../api/programs';
import { Program } from '../../../types/school';

export const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [name, setName] = useState('');
  // Backend expects type: Undergraduate | Postgraduate; our UI previously used academic labels directly.
  const [category, setCategory] = useState<'Undergraduate' | 'Postgraduate'>('Undergraduate');
  const [subType, setSubType] = useState('HND');

  useEffect(() => {
    getPrograms()
      .then(resp => {
        // API returns { data: Program[] } per api helper OR raw array if backend route returns array directly.
        const data: any = (resp as any)?.data || resp; // defensive
        setPrograms(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const payload: any = { name: name.trim(), type: category, subType };
    const created = await createProgram(payload);
    const programObj: any = (created as any)?.data || created; // unify
    setPrograms(prev => [programObj, ...prev]);
    setName('');
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteProgram(id);
    setPrograms(prev => prev.filter(p => (p._id || p.id) !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Programs</h1>
      <div className="mb-4 flex space-x-2">
        <input value={name} onChange={e => setName(e.target.value)} className="px-3 py-2 border rounded" placeholder="Program name" />
        <select value={category} onChange={e => setCategory(e.target.value as any)} className="px-3 py-2 border rounded">
          <option value="Undergraduate">Undergraduate</option>
          <option value="Postgraduate">Postgraduate</option>
        </select>
        <select value={subType} onChange={e => setSubType(e.target.value)} className="px-3 py-2 border rounded">
          <option value="HND">HND</option>
          <option value="Diploma">Diploma</option>
          <option value="Bachelor">Bachelor</option>
          <option value="Masters">Masters</option>
          <option value="PhD">PhD</option>
        </select>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">Add Program</button>
      </div>
      <div className="bg-white rounded shadow-sm p-4">
        <ul>
          {programs.map(p => (
            <li key={p._id || (p as any).id} className="flex justify-between border-b py-2">
              <div>
                {p.name}
                <span className="text-xs text-gray-500 ml-2">{p.type}{(p as any).subType ? ` / ${(p as any).subType}` : ''}</span>
              </div>
              <button onClick={() => handleDelete(p._id || (p as any).id)} className="text-red-600">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProgramsPage;
