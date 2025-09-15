import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  School, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { formatXAF } from '../../utils/currency';
import { getPrograms } from '../../api/programs';
import { getDepartments } from '../../api/departments';
import { getOHADAAccounts } from '../../api/ohada';
import { 
  getTuitionStructures, 
  createTuitionStructure, 
  updateTuitionStructure,
  validateOHADAAccounts 
} from '../../api/tuitionManagement';
import { TuitionStructure, TuitionInstallment } from '../../types/tuition';
import { Program, Department } from '../../types/school';
import { OHADAAccount } from '../../types/ohada';

const TuitionStructureManager: React.FC = () => {
  // const { user } = useAuth(); // reserved for future permission gating
  const { showToast } = useUI();
  
  const [structures, setStructures] = useState<TuitionStructure[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ohadaAccounts, setOhadaAccounts] = useState<OHADAAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<TuitionStructure | null>(null);
  const [validationStatus, setValidationStatus] = useState<{ valid: boolean; missingAccounts: string[] } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    program: '',
    department: '',
    level: 1,
    academicYear: '',
    installments: [
      {
        key: 'registration',
        label: 'Registration Fee',
        amount: 0,
        dueDate: '',
        ohadaAccountCode: '701001', // Registration Fee Income
        ohadaAccountName: 'Registration Fee Income',
        isRequired: true,
        order: 1
      },
      {
        key: 'first_installment',
        label: 'First Installment',
        amount: 0,
        dueDate: '',
        ohadaAccountCode: '701002', // Tuition Fee Income
        ohadaAccountName: 'Tuition Fee Income',
        isRequired: true,
        order: 2
      }
    ] as TuitionInstallment[]
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const errors: string[] = [];

    // Use Promise.allSettled so one failing endpoint doesn't block others (was causing empty dropdowns)
    const results = await Promise.allSettled([
      getTuitionStructures(),
      getPrograms(),
      getDepartments(),
      getOHADAAccounts(),
      validateOHADAAccounts()
    ]);

    const [structuresRes, programsRes, departmentsRes, accountsRes, validationRes] = results;

    if (structuresRes.status === 'fulfilled') {
      const raw: any = (structuresRes.value as any)?.data ?? (structuresRes.value as any);
      setStructures(Array.isArray(raw) ? raw : []);
    } else {
      errors.push('tuition structures');
      console.error('Failed to fetch tuition structures', structuresRes.reason);
    }

    if (programsRes.status === 'fulfilled') {
      const raw: any = (programsRes.value as any)?.data ?? (programsRes.value as any);
      setPrograms(Array.isArray(raw) ? raw : []);
    } else {
      errors.push('programs');
      console.error('Failed to fetch programs', programsRes.reason);
    }

    if (departmentsRes.status === 'fulfilled') {
      const raw: any = (departmentsRes.value as any)?.data ?? (departmentsRes.value as any);
      setDepartments(Array.isArray(raw) ? raw : []);
    } else {
      errors.push('departments');
      console.error('Failed to fetch departments', departmentsRes.reason);
    }

    if (accountsRes.status === 'fulfilled') {
      const raw: any = (accountsRes.value as any)?.data ?? (accountsRes.value as any);
      setOhadaAccounts(Array.isArray(raw) ? raw : []);
    } else {
      errors.push('OHADA accounts');
      console.error('Failed to fetch OHADA accounts', accountsRes.reason);
    }

    if (validationRes.status === 'fulfilled') {
      setValidationStatus(validationRes.value.data);
    } else {
      // Not critical – just log
      console.warn('Failed to validate OHADA accounts', validationRes.reason);
    }

    if (errors.length) {
      showToast(`Some data failed to load: ${errors.join(', ')}`, 'error');
    }

    setLoading(false);
  };

  // Filter departments by selected program (if department.program is populated or holds an id)
  const filteredDepartments = React.useMemo(() => {
    if (!formData.program) return departments;
    return departments.filter(d => {
      if (!d.program) return true; // keep loose if backend didn't populate
      if (typeof d.program === 'string') return d.program === formData.program;
      return (d.program as any)?._id === formData.program || (d.program as any)?.id === formData.program;
    });
  }, [departments, formData.program]);

  // Universal safe array helper to eliminate undefined .map crashes
  const asArray = <T,>(val: T[] | undefined | null | any): T[] => {
    return Array.isArray(val) ? val : [];
  };

  const handleCreateStructure = async () => {
    if (!formData.name || !formData.program || !formData.department || !formData.academicYear) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (formData.installments.length === 0) {
      showToast('Please add at least one installment', 'error');
      return;
    }

    // Validate OHADA accounts
    const invalidAccounts = formData.installments.filter(inst => 
      !ohadaAccounts.find(acc => acc.code === inst.ohadaAccountCode)
    );

    if (invalidAccounts.length > 0) {
      showToast(`Invalid OHADA accounts: ${invalidAccounts.map(i => i.ohadaAccountCode).join(', ')}`, 'error');
      return;
    }

    try {
      const totalAmount = formData.installments.reduce((sum, inst) => sum + inst.amount, 0);
      
      await createTuitionStructure({
        ...formData,
        // Cast id strings to any so API layer sends raw ids; backend resolves relations
        program: formData.program as any,
        department: formData.department as any,
        totalAmount
      });

      setShowCreateModal(false);
      resetForm();
      fetchAllData();
      showToast('Tuition structure created successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create tuition structure', 'error');
    }
  };

  const handleUpdateStructure = async () => {
    if (!editingStructure) return;

    try {
      const totalAmount = formData.installments.reduce((sum, inst) => sum + inst.amount, 0);
      
      await updateTuitionStructure(editingStructure._id, {
        ...formData,
        program: formData.program as any,
        department: formData.department as any,
        totalAmount
      });

      setEditingStructure(null);
      resetForm();
      fetchAllData();
      showToast('Tuition structure updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update tuition structure', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      program: '',
      department: '',
      level: 1,
      academicYear: '',
      installments: [
        {
          key: 'registration',
          label: 'Registration Fee',
          amount: 0,
          dueDate: '',
          ohadaAccountCode: '701001',
          ohadaAccountName: 'Registration Fee Income',
          isRequired: true,
          order: 1
        },
        {
          key: 'first_installment',
          label: 'First Installment',
          amount: 0,
          dueDate: '',
          ohadaAccountCode: '701002',
          ohadaAccountName: 'Tuition Fee Income',
          isRequired: true,
          order: 2
        }
      ]
    });
  };

  const openEditModal = (structure: TuitionStructure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      program: (structure as any)?.program && typeof (structure as any).program === 'object' ? (structure as any).program._id : (structure as any).program || '',
      department: (structure as any)?.department && typeof (structure as any).department === 'object' ? (structure as any).department._id : (structure as any).department || '',
      level: structure.level,
      academicYear: structure.academicYear,
      installments: [...(structure.installments || [])]
    });
    setShowCreateModal(true);
  };

  const addInstallment = () => {
    const newOrder = Math.max(...formData.installments.map(i => i.order), 0) + 1;
    const newInstallment: TuitionInstallment = {
      key: `installment_${newOrder}`,
      label: `Installment ${newOrder}`,
      amount: 0,
      dueDate: '',
      ohadaAccountCode: '701002', // Default to Tuition Fee Income
      ohadaAccountName: 'Tuition Fee Income',
      isRequired: true,
      order: newOrder
    };

    setFormData(prev => ({
      ...prev,
      installments: [...prev.installments, newInstallment]
    }));
  };

  const updateInstallment = (index: number, field: keyof TuitionInstallment, value: any) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.map((inst, i) => 
        i === index ? { ...inst, [field]: value } : inst
      )
    }));
  };

  const removeInstallment = (index: number) => {
    if (formData.installments.length <= 1) {
      showToast('At least one installment is required', 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index)
    }));
  };

  const getIncomeAccounts = () => {
    return ohadaAccounts.filter(acc => acc.type === 'income');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tuition Structure Management</h2>
          <p className="text-gray-600 mt-1">Configure tuition installments with OHADA account integration</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Structure</span>
        </button>
      </div>

      {/* OHADA Validation Status */}
      {validationStatus && (
        <div className={`p-4 rounded-lg border ${
          validationStatus.valid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {validationStatus.valid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h4 className="font-medium text-gray-900">OHADA Account Validation</h4>
              {validationStatus.valid ? (
                <p className="text-sm text-green-700">All required OHADA accounts are configured</p>
              ) : (
                <div>
                  <p className="text-sm text-red-700">Missing OHADA accounts:</p>
                  <ul className="text-sm text-red-600 mt-1">
                    {(validationStatus.missingAccounts || []).map(acc => (
                      <li key={acc}>• {acc}</li>
                    ))}
                    {(!validationStatus.missingAccounts || validationStatus.missingAccounts.length === 0) && (
                      <li className="italic text-red-500">No specific account codes returned</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tuition Structures List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Configured Tuition Structures</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Structure Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program & Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Installments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
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
              {asArray<TuitionStructure>(structures).map((structure: TuitionStructure) => (
                <tr key={structure._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{structure.name}</div>
                      <div className="text-sm text-gray-500">Academic Year: {structure.academicYear}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{(structure as any)?.program && typeof (structure as any).program === 'object' ? (structure as any).program.name : (typeof (structure as any).program === 'string' ? (structure as any).program : '—')}</div>
                      <div className="text-sm text-gray-500">{(structure as any)?.department && typeof (structure as any).department === 'object' ? (structure as any).department.name : (typeof (structure as any).department === 'string' ? (structure as any).department : '—')} - Level {structure.level}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(structure.installments ? structure.installments.length : 0)} installments</div>
                    <div className="text-xs text-gray-500">
                      {(structure.installments || []).map(inst => inst.label).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatXAF(structure.totalAmount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      structure.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {structure.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(structure)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Structure"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Delete Structure"
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

        {structures.length === 0 && (
          <div className="p-8 text-center">
            <School className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No tuition structures</h3>
            <p className="text-sm text-gray-500">Create your first tuition structure to get started.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingStructure ? 'Edit Tuition Structure' : 'Create Tuition Structure'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingStructure(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Structure Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., HND Computer Engineering 2024-2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2024-2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Program</option>
                      {asArray<Program>(programs).map((program: Program) => (
                        <option key={program._id || program.id} value={program._id || program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {filteredDepartments.length === 0 && (
                        <option disabled value="">{departments.length ? 'No departments match program' : 'No departments found'}</option>
                      )}
                      {asArray<Department>(filteredDepartments).map((dept: Department) => (
                        <option key={dept._id || dept.id} value={dept._id || dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                      <option value={3}>Level 3</option>
                      <option value={4}>Level 4</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Installments Configuration */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Payment Installments</h4>
                  <button
                    onClick={addInstallment}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Installment</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {asArray<TuitionInstallment>(formData.installments).map((installment: TuitionInstallment, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Installment {index + 1}</h5>
                        {formData.installments.length > 1 && (
                          <button
                            onClick={() => removeInstallment(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                          <input
                            type="text"
                            value={installment.label}
                            onChange={(e) => updateInstallment(index, 'label', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Amount (XAF)</label>
                          <input
                            type="number"
                            value={installment.amount}
                            onChange={(e) => updateInstallment(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                          <input
                            type="date"
                            value={installment.dueDate}
                            onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">OHADA Account</label>
                          <select
                            value={installment.ohadaAccountCode}
                            onChange={(e) => {
                              const account = ohadaAccounts.find(acc => acc.code === e.target.value);
                              updateInstallment(index, 'ohadaAccountCode', e.target.value);
                              updateInstallment(index, 'ohadaAccountName', account?.name || '');
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Account</option>
                            {getIncomeAccounts().map(account => (
                              <option key={account._id} value={account.code}>
                                {account.code} - {account.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Amount Display */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Total Tuition Amount:</span>
                    <span className="text-lg font-bold text-blue-900">
                      {formatXAF(formData.installments.reduce((sum, inst) => sum + inst.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingStructure(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingStructure ? handleUpdateStructure : handleCreateStructure}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingStructure ? 'Update' : 'Create'} Structure</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TuitionStructureManager;