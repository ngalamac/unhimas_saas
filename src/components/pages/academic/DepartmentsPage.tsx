import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit, Trash2, Eye, Users, BookOpen } from 'lucide-react';
import { Department } from '../../../types/school';
import { getDepartments, createDepartment, deleteDepartment } from '../../../api/departments';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const nameRef = React.useRef<HTMLInputElement | null>(null);

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

  // edit/save flow not implemented yet for departments; update handler omitted to avoid unused symbol

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Departments</h1>
          <p className="text-gray-600">Manage all academic departments and their programs</p>
        </div>
  <button onClick={() => { nameRef.current?.focus(); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
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
              <p className="text-sm text-gray-600">Total Programs</p>
              <p className="text-xl font-bold text-gray-900">
                {departments.reduce((sum, dept) => sum + (dept.programs ? dept.programs.length : 0), 0)}
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
                  <span className="text-gray-600">Programs:</span>
                  <span className="font-medium text-gray-900">{department.programs ? department.programs.length : 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Students:</span>
                  <span className="font-medium text-gray-900">
                    {Math.floor(Math.random() * 200) + 50}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Faculty:</span>
                  <span className="font-medium text-gray-900">
                    {Math.floor(Math.random() * 15) + 5}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Head of Department</p>
                    <p className="text-sm font-medium text-gray-900">
                      {typeof department.hod === 'string' ? department.hod : (department.hod ? `${(department.hod as any).firstName || ''} ${(department.hod as any).lastName || ''}` : 'Not Assigned')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <Edit className="w-4 h-4" />
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
        <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder="New department name" className="px-3 py-2 border rounded" />
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">Add Department</button>
      </div>
    </div>
  );
};