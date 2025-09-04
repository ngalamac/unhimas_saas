import React, { useEffect, useState } from 'react';
import { getPrograms, createProgram, deleteProgram } from '../../../api/programs';
import { Program } from '../../../types/school';

export const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('HND');

  useEffect(() => { getPrograms().then(setPrograms).catch(() => {}); }, []);

  const handleCreate = async () => {
    const p = await createProgram({ name, type });
    setPrograms(prev => [p, ...prev]);
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
        <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2 border rounded">
          <option>HND</option>
          <option>Bachelor</option>
          <option>Masters</option>
        </select>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">Add Program</button>
      </div>
      <div className="bg-white rounded shadow-sm p-4">
        <ul>
          {programs.map(p => (
            <li key={p._id || p.id} className="flex justify-between border-b py-2">
              <div>{p.name} <span className="text-xs text-gray-500">{p.type}</span></div>
              <button onClick={() => handleDelete(p._id || p.id)} className="text-red-600">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProgramsPage;
