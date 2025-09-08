import React, { useEffect, useState } from 'react';
import { getDepartments, createDepartment, deleteDepartment } from '../../../api/departments';
import { Department } from '../../../types/school';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');

  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}); }, []);

  const handleCreate = async () => {
    const d = await createDepartment({ name });
    setDepartments(prev => [d, ...prev]);
    setName('');
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteDepartment(id);
    setDepartments(prev => prev.filter(d => (d._id || d.id) !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Departments</h1>
      <div className="mb-4 flex space-x-2">
        <input value={name} onChange={e => setName(e.target.value)} className="px-3 py-2 border rounded" placeholder="Department name" />
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">Add Department</button>
      </div>
      <div className="bg-white rounded shadow-sm p-4">
        <ul>
          {departments.map(d => (
            <li key={d._id || d.id} className="flex justify-between border-b py-2">
              <div>{d.name}</div>
              <button onClick={() => handleDelete(d._id || d.id)} className="text-red-600">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DepartmentsPage;
