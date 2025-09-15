import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Download, Plus, GraduationCap, Users, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';

interface Program {
  _id: string;
  name: string;
  code: string;
  description: string;
  duration: number; // in months
  level: string;
  department: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  studentCount: number;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProgramStats {
  total: number;
  active: number;
  inactive: number;
  totalStudents: number;
  byLevel: Array<{ _id: string; count: number }>;
}

// Dedicated modal component (memoized) to prevent unnecessary unmounts that cause input focus loss
interface ProgramModalProps {
  mode: 'create' | 'edit' | 'view' | null;
  program: Program | null;
  formName: string; formCode: string; formDescription: string; formDuration: number; formLevel: string; formIsActive: boolean;
  setFormName: (v: string) => void; setFormCode: (v: string) => void; setFormDescription: (v: string) => void; setFormDuration: (v: number) => void; setFormLevel: (v: string) => void; setFormIsActive: (v: boolean) => void;
  onClose: () => void;
  onSave: () => void;
}

const ProgramModal: React.FC<ProgramModalProps> = React.memo(({ mode, program, formName, formCode, formDescription, formDuration, formLevel, formIsActive, setFormName, setFormCode, setFormDescription, setFormDuration, setFormLevel, setFormIsActive, onClose, onSave }) => {
  if (!mode) return null;
  const isView = mode === 'view';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" role="dialog" aria-modal="true" aria-labelledby="program-modal-title">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 id="program-modal-title" className="text-xl font-bold mb-4">
          {mode === 'create' ? 'Add Program' : mode === 'edit' ? 'Edit Program' : 'View Program'}
        </h2>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!isView) onSave(); }}
          className="space-y-4"
          aria-describedby="program-form-help"
        >
          <div>
            <label htmlFor="program-name" className="block text-sm font-medium text-gray-700 mb-1">Program Name <span className="text-red-500" aria-hidden="true">*</span></label>
            <input
              id="program-name"
              disabled={isView}
              value={formName}
              onChange={e => setFormName(e.target.value)}
              aria-required="true"
              aria-invalid={(!(formName || '').trim()).toString()}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. Computer Science"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="program-code" className="block text-sm font-medium text-gray-700 mb-1">Code <span className="text-red-500" aria-hidden="true">*</span></label>
            <input
              id="program-code"
              disabled={isView}
              value={formCode}
              onChange={e => setFormCode(e.target.value)}
              aria-required="true"
              aria-invalid={(!(formCode || '').trim()).toString()}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. CS101"
            />
          </div>
          <div>
            <label htmlFor="program-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="program-description"
              disabled={isView}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              aria-describedby="program-description-help"
              className="w-full px-3 py-2 border rounded min-h-[90px]"
              placeholder="Summarize the program objectives..."
            />
            <p id="program-description-help" className="mt-1 text-xs text-gray-500">Optional short summary (students can see this).</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="program-duration" className="block text-sm font-medium text-gray-700 mb-1">Duration (months) <span className="text-red-500" aria-hidden="true">*</span></label>
              <input
                id="program-duration"
                disabled={isView}
                type="number"
                min={1}
                value={formDuration}
                onChange={e => setFormDuration(Number(e.target.value) || 0)}
                aria-required="true"
                aria-invalid={(formDuration < 1).toString()}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="program-level" className="block text-sm font-medium text-gray-700 mb-1">Level <span className="text-red-500" aria-hidden="true">*</span></label>
              <select
                id="program-level"
                disabled={isView}
                value={formLevel}
                onChange={e => setFormLevel(e.target.value)}
                aria-required="true"
                aria-invalid={(!(formLevel || '').trim()).toString()}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Level</option>
                <option value="Certificate">Certificate</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>
          <fieldset className="border rounded px-3 py-2">
            <legend className="text-sm font-medium text-gray-700">Status</legend>
            <label htmlFor="program-active" className="flex items-center space-x-2 text-sm mt-1">
              <input
                id="program-active"
                disabled={isView}
                type="checkbox"
                checked={formIsActive}
                onChange={e => setFormIsActive(e.target.checked)}
              />
              <span>Active</span>
            </label>
          </fieldset>
          <div id="program-form-help" className="sr-only">Fields marked * are required.</div>
          <div className="pt-4 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            {!isView && (
              <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded">Save</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
});

export const ProgramsPage: React.FC = () => {
  // Modal state for create/edit/view
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [modalProgram, setModalProgram] = useState<Program | null>(null);

  // Form state for create/edit
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState(12);
  const [formLevel, setFormLevel] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Open modal for create/edit/view
  const openModal = (mode: 'create' | 'edit' | 'view', program?: Program) => {
    setModalMode(mode);
    setModalProgram(program || null);
    if (mode === 'edit' && program) {
      setFormName(program.name);
      setFormCode(program.code);
      setFormDescription(program.description);
      setFormDuration(program.duration);
      setFormLevel(program.level);
      setFormIsActive(program.isActive);
    } else if (mode === 'create') {
      setFormName('');
      setFormCode('');
      setFormDescription('');
      setFormDuration(12);
      setFormLevel('');
      setFormIsActive(true);
    }
  };

  // Save program (create or edit)
  const handleSaveProgram = async () => {
  if (!(formName || '').trim() || !(formCode || '').trim() || !(formLevel || '').trim()) {
      showToast('Name, code, and level are required', 'error');
      return;
    }
    try {
      if (modalMode === 'create') {
        const payload = {
          name: formName,
          code: formCode,
          description: formDescription,
          duration: formDuration,
          level: formLevel,
          isActive: formIsActive
        };
        await fetchClient.post('/api/programs', payload);
        showToast('Program created successfully', 'success');
      } else if (modalMode === 'edit' && modalProgram) {
        const payload = {
          name: formName,
          code: formCode,
          description: formDescription,
          duration: formDuration,
          level: formLevel,
          isActive: formIsActive
        };
        await fetchClient.put(`/api/programs/${modalProgram._id}`, payload);
        showToast('Program updated successfully', 'success');
      }
      setModalMode(null);
      fetchPrograms();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to save program', 'error');
    }
  };

  const memoizedCloseModal = useCallback(() => setModalMode(null), []);
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { showToast } = useUI();
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<ProgramStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // UI State
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Fetch programs
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterLevel && { level: filterLevel }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(showActiveOnly && { isActive: 'true' })
      });

      const response = await fetchClient.get(`/api/programs?${params}`);
      const raw = await response.json();
      // Accept shapes:
      // 1) Array<Program>
      // 2) { data: Program[], total?: number }
      // 3) { results: Program[], total: number }
      // 4) { items: Program[], pagination: { total } }
      let list: any[] = [];
      let totalCount = 0;
      if (Array.isArray(raw)) {
        list = raw;
        totalCount = raw.length;
      } else if (raw) {
        list = raw.data || raw.results || raw.items || [];
        totalCount = raw.total || raw.count || raw.pagination?.total || list.length;
      }
      setPrograms(list);
      setTotal(totalCount);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch programs');
      showToast('Failed to fetch programs', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetchClient.get('/api/programs/stats/overview');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch program statistics:', err);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [page, pageSize, searchTerm, filterLevel, filterDepartment, showActiveOnly]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDeleteProgram = async (programId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this program?')) {
      return;
    }

    try {
      await fetchClient.delete(`/api/programs/${programId}`);
      showToast('Program deactivated successfully', 'success');
      fetchPrograms();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete program', 'error');
    }
  };

  const handleExportPrograms = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(searchTerm && { search: searchTerm }),
        ...(filterLevel && { level: filterLevel }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(showActiveOnly && { isActive: 'true' })
      });

  const response = await fetchClient.get(`/api/programs/export?${params}`);
  const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `programs-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Programs exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export programs', 'error');
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getLevelColor = (level?: string) => {
    if (!level || typeof level !== 'string') return 'bg-gray-100 text-gray-800';
    switch (level.toLowerCase()) {
      case 'certificate': return 'bg-blue-100 text-blue-800';
      case 'diploma': return 'bg-green-100 text-green-800';
      case 'bachelor': return 'bg-purple-100 text-purple-800';
      case 'master': return 'bg-orange-100 text-orange-800';
      case 'phd': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // (Removed unused formatDate to satisfy lint)

  if (loading && programs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgramModal
        mode={modalMode}
        program={modalProgram}
        formName={formName}
        formCode={formCode}
        formDescription={formDescription}
        formDuration={formDuration}
        formLevel={formLevel}
        formIsActive={formIsActive}
        setFormName={setFormName}
        setFormCode={setFormCode}
        setFormDescription={setFormDescription}
        setFormDuration={setFormDuration}
        setFormLevel={setFormLevel}
        setFormIsActive={setFormIsActive}
        onClose={memoizedCloseModal}
        onSave={handleSaveProgram}
      />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs Management</h1>
          <p className="text-gray-600">Manage academic programs and courses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openModal('create')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Program</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Programs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Programs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Programs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search programs..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="Certificate">Certificate</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {/* This would be populated from departments API */}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="activeOnly"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="activeOnly" className="ml-2 block text-sm text-gray-900">
                Show active programs only
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Programs ({total})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportPrograms('csv')}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExportPrograms('xlsx')}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level & Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.map((program) => (
                <tr key={program._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {program.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {program.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{program.department?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor((program as any).level || (program as any).subType)}`}>
                        {(program as any).level || (program as any).subType || '—'}
                      </span>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {(program as any).duration != null ? (program as any).duration : '?'} months
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {(program as any).studentCount != null ? (program as any).studentCount : 0} students
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.isActive)}`}>
                      {program.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('view', program)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('edit', program)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(program._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= total}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {programs.length === 0 && !loading && (
        <div className="text-center py-12">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No programs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterLevel || filterDepartment
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding a new program.'}
          </p>
          {!searchTerm && !filterLevel && !filterDepartment && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;