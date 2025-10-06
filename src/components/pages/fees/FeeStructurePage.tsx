import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Plus, Edit, Trash2, Eye, Search, Filter, Copy, Calculator } from 'lucide-react';
import { formatXAF } from '../../../utils/currency';
import { useAuth } from '../../../context/AuthContext';
import { isFinanceRole } from '../../../utils/rolePermissions';
import { FeeStructure } from '../../../types/school';
import fetchClient from '../../../lib/fetchClient';

export const FeeStructurePage: React.FC = () => {
  const { user } = useAuth();
  const isFinance = isFinanceRole(((user as any)?.role || (user as any)?.type) as string);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [programs, setPrograms] = useState<Array<{ _id: string; name: string; type?: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [feeToEdit, setFeeToEdit] = useState<FeeStructure | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredFeeStructures = useMemo(() => {
    return feeStructures.filter((fee: any) => {
      const prog = programs.find(p => String(p._id) === String(fee.programId));
      const matchesSearch = prog?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
      const matchesProgram = !filterProgram || String(fee.programId) === String(filterProgram);
      const matchesBatch = !filterBatch || String(fee.batch) === String(filterBatch);
      return matchesSearch && matchesProgram && matchesBatch;
    });
  }, [feeStructures, programs, searchTerm, filterProgram, filterBatch]);

  useEffect(() => {
    // Load programs for dropdown
    fetchClient.get('/api/programs').then(async (res) => {
      const body = res.ok ? await res.json() : [];
      setPrograms(Array.isArray(body) ? body : (body.data || []));
    }).catch(() => {});
    // TODO: Replace with real fee structures endpoint when available
    setFeeStructures([]);
  }, []);

  const formatCurrency = (amount: number) => formatXAF(amount);

  const handleDeleteFee = (feeId: string) => {
    setFeeToDelete(feeId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (feeToDelete) {
      setFeeStructures(prev => prev.filter(f => f.id !== feeToDelete));
      setShowDeleteModal(false);
      setFeeToDelete(null);
    }
  };

  const handleEditFee = (fee: FeeStructure) => {
    setFeeToEdit(fee);
    setShowEditModal(true);
  };

  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const handleDuplicateFee = (fee: FeeStructure) => {
    const newFee: FeeStructure = {
      ...fee,
      id: Date.now().toString(),
      createdDate: new Date().toISOString().split('T')[0]
    };
    setFeeStructures(prev => [...prev, newFee]);
    setToast({ open: true, message: 'Fee structure duplicated successfully!' });
    setTimeout(() => setToast({ open: false, message: '' }), 2500);
  };

  const calculateTotal = (tuition: number, registration: number, exam: number, library: number) => {
    return tuition + registration + exam + library;
  };

  if (!isFinance) {
    return <div className="p-6 text-sm text-gray-600">Not authorized</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structure</h1>
          <p className="text-gray-600">Manage tuition and other fees for different programs</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setToast({ open: true, message: 'Fee Calculator coming soon.' })} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Calculator className="w-4 h-4" />
            <span>Fee Calculator</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fee Structure</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Tuition (HND)</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(462500)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Tuition (Bachelor)</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(550000)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Tuition (Masters)</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(750000)}
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
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            {programs.map(program => (
              <option key={program._id} value={program._id}>{program.name}</option>
            ))}
          </select>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Batches</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2025-2026">2025-2026</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Bulk Update</span>
          </button>
        </div>
      </div>

      {/* Fee Structures Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuition Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Library Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFeeStructures.map((fee: any) => {
                const program = programs.find(p => String(p._id) === String(fee.programId));
                return (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{program?.name || '—'}</div>
                        <div className="text-sm text-gray-500">{program?.type || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Level {fee.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fee.batch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(fee.tuitionFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(fee.registrationFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(fee.examFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(fee.libraryFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {formatCurrency(fee.totalFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => alert(`Viewing details for ${program?.name} Level ${fee.level}`)}
                          className="text-blue-600 hover:text-blue-900" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditFee(fee)}
                          className="text-green-600 hover:text-green-900" 
                          title="Edit Fee Structure"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDuplicateFee(fee)}
                          className="text-purple-600 hover:text-purple-900" 
                          title="Duplicate Fee Structure"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFee(fee.id)}
                          className="text-red-600 hover:text-red-900" 
                          title="Delete Fee Structure"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Fee Structure Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Fee Structure</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Program</option>
                    {mockPrograms.map(program => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Level</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Batch</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Fee (XAF)</label>
                  <input
                    type="number"
                    placeholder="450000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Fee (XAF)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Fee (XAF)</label>
                  <input
                    type="number"
                    placeholder="15000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Library Fee (XAF)</label>
                  <input
                    type="number"
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Total fee will be calculated automatically based on the individual fee components.
                </p>
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
                onClick={() => { setToast({ open: true, message: 'Fee structure created successfully!' }); setShowCreateModal(false); setTimeout(() => setToast({ open: false, message: '' }), 2500); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Fee Structure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fee Structure Modal */}
      {showEditModal && feeToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Fee Structure</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Fee (XAF)</label>
                  <input
                    type="number"
                    defaultValue={feeToEdit.tuitionFee}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Fee (XAF)</label>
                  <input
                    type="number"
                    defaultValue={feeToEdit.registrationFee}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Fee (XAF)</label>
                  <input
                    type="number"
                    defaultValue={feeToEdit.examFee}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Library Fee (XAF)</label>
                  <input
                    type="number"
                    defaultValue={feeToEdit.libraryFee}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  defaultValue={feeToEdit.isActive ? 'active' : 'inactive'}
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
                onClick={() => { setToast({ open: true, message: 'Fee structure updated successfully!' }); setShowEditModal(false); setTimeout(() => setToast({ open: false, message: '' }), 2500); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
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
                Are you sure you want to delete this fee structure? This action cannot be undone.
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
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* lightweight toast */}
    {toast.open && (
      <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded shadow-lg">{toast.message}</div>
    )}
  );
};