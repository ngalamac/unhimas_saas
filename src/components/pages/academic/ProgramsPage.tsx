import React, { useState } from 'react';
import { GraduationCap, Plus, Edit, Trash2, Eye, Users, BookOpen, Search, Filter, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import { mockPrograms } from '../../../data/mockData';
import { Program } from '../../../types/school';

export const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>(mockPrograms);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<Program | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || program.type === filterType;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && program.isActive) ||
                         (filterStatus === 'inactive' && !program.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getProgramTypeColor = (type: string) => {
    switch (type) {
      case 'HND': return 'bg-blue-100 text-blue-800';
      case 'Bachelor': return 'bg-green-100 text-green-800';
      case 'Masters': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteProgram = (programId: string) => {
    setProgramToDelete(programId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (programToDelete) {
      setPrograms(prev => prev.filter(p => p.id !== programToDelete));
      setShowDeleteModal(false);
      setProgramToDelete(null);
    }
  };

  const handleEditProgram = (program: Program) => {
    setProgramToEdit(program);
    setShowEditModal(true);
  };

  const toggleProgramStatus = (programId: string) => {
    setPrograms(prev => prev.map(program => 
      program.id === programId 
        ? { ...program, isActive: !program.isActive }
        : program
    ));
  };

  const handleDuplicateProgram = (program: Program) => {
    const newProgram: Program = {
      ...program,
      id: Date.now().toString(),
      name: `${program.name} (Copy)`,
      createdDate: new Date().toISOString().split('T')[0]
    };
    setPrograms(prev => [...prev, newProgram]);
    alert('Program duplicated successfully!');
  };

  const handleViewCourses = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    alert(`Viewing courses for ${program?.name}`);
  };

  const handleManageStudents = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    alert(`Managing students for ${program?.name}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Programs</h1>
          <p className="text-gray-600">Manage HND, Bachelor, and Masters programs</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <GraduationCap className="w-4 h-4" />
            <span>Export Programs</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Program</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Programs</p>
              <p className="text-xl font-bold text-gray-900">{programs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">HND Programs</p>
              <p className="text-xl font-bold text-gray-900">
                {programs.filter(p => p.type === 'HND').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Bachelor Programs</p>
              <p className="text-xl font-bold text-gray-900">
                {programs.filter(p => p.type === 'Bachelor').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Masters Programs</p>
              <p className="text-xl font-bold text-gray-900">
                {programs.filter(p => p.type === 'Masters').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="HND">HND</option>
            <option value="Bachelor">Bachelor</option>
            <option value="Masters">Masters</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <GraduationCap className="w-4 h-4" />
            <span>Bulk Actions</span>
          </button>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <div key={program.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProgramTypeColor(program.type)}`}>
                      {program.type}
                    </span>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        program.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {program.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleProgramStatus(program.id)}
                  className="text-gray-400 hover:text-gray-600"
                  title={program.isActive ? 'Deactivate Program' : 'Activate Program'}
                >
                  {program.isActive ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                {program.name}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{program.duration} years</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Semesters/Year:</span>
                  <span className="font-medium text-gray-900">{program.semestersPerYear}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Courses:</span>
                  <span className="font-medium text-gray-900">{program.courses.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(program.createdDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {program.hod && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Head of Department</p>
                      <p className="text-sm font-medium text-gray-900">
                        {program.hod.firstName} {program.hod.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => alert(`Viewing details for ${program.name}`)}
                    className="text-blue-600 hover:text-blue-900" 
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEditProgram(program)}
                    className="text-green-600 hover:text-green-900" 
                    title="Edit Program"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDuplicateProgram(program)}
                    className="text-purple-600 hover:text-purple-900" 
                    title="Duplicate Program"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteProgram(program.id)}
                    className="text-red-600 hover:text-red-900" 
                    title="Delete Program"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleViewCourses(program.id)}
                  className="flex-1 text-sm text-blue-600 hover:text-blue-900 font-medium flex items-center justify-center space-x-1 py-1"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Courses</span>
                </button>
                <button 
                  onClick={() => handleManageStudents(program.id)}
                  className="flex-1 text-sm text-green-600 hover:text-green-900 font-medium flex items-center justify-center space-x-1 py-1"
                >
                  <Users className="w-3 h-3" />
                  <span>Students</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Program</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Name</label>
                <input
                  type="text"
                  placeholder="e.g., Bachelor of Science in Computer Engineering"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Type</option>
                    <option value="HND">HND</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Masters">Masters</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semesters per Year</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="2">2 Semesters</option>
                  <option value="3">3 Semesters</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Head of Department</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select HOD</option>
                  <option value="1">Dr. Jean Mbarga</option>
                  <option value="2">Dr. Paul Fotso</option>
                  <option value="3">Dr. Grace Biya</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Program created successfully!');
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this program? This action cannot be undone and will affect all associated students and courses.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {showEditModal && programToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Program</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Name</label>
                <input
                  type="text"
                  defaultValue={programToEdit.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program Type</label>
                  <select 
                    defaultValue={programToEdit.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HND">HND</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Masters">Masters</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Years)</label>
                  <input
                    type="number"
                    defaultValue={programToEdit.duration}
                    min="1"
                    max="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semesters per Year</label>
                <select 
                  defaultValue={programToEdit.semestersPerYear}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2">2 Semesters</option>
                  <option value="3">3 Semesters</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  defaultValue={programToEdit.isActive ? 'active' : 'inactive'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Program updated successfully!');
                  setShowEditModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};