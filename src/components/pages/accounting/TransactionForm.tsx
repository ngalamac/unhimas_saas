import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, FileText, Building2, Users, GraduationCap, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';
import { formatXAF } from '../../../utils/currency';

interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  description?: string;
}

interface TransactionFormProps {
  onCreated?: () => void;
  onCancel?: () => void;
  initialData?: any;
  // when false, TransactionForm will not render its internal "Add Transaction" trigger button
  showTrigger?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onCreated, onCancel, initialData, showTrigger }) => {
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other',
    linkedStudent: '',
    linkedStaff: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAuth();
  const { currentBranch, managedBranches } = useBranch();
  const { showToast } = useUI();
  const isSuperAdmin = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;
  const [branch, setBranch] = useState<string | undefined>(currentBranch ? (currentBranch as any)._id || (currentBranch as any).id : undefined);
  const [availableBranches, setAvailableBranches] = useState<any[]>(managedBranches && managedBranches.length ? managedBranches : []);

  const fetchBranches = async () => {
    try {
      const res = await fetchClient.get('/api/branches');
      if (res.ok) {
        const data = await res.json();
        // backend returns { data: branches, meta: ... } — normalize to an array
        const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
        setAvailableBranches(list);
        if (!branch && list && list.length) {
          setBranch((list[0]._id || list[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching branches', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchStudentsAndStaff();
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (isSuperAdmin) {
      if (managedBranches && (Array.isArray(managedBranches) ? managedBranches.length : Array.isArray((managedBranches as any)?.data) ? (managedBranches as any).data.length : 0)) {
        const list = Array.isArray(managedBranches) ? managedBranches : ((managedBranches as any)?.data || []);
        setAvailableBranches(list);
        if (!branch && list.length) setBranch(list[0]._id || list[0].id);
      } else {
        fetchBranches();
      }
    }
  }, [isSuperAdmin, managedBranches]);

  // Fallback category sets (from user-provided list) used when backend returns none
  const fallbackExpenseCategories = [
    'Payroll Expenses',
    'Utilities',
    'Publicity Expense',
    'Examination expenses',
    'Repairs & maintenance',
    'Teaching materials',
    'Laboratory supplies',
    'Internship expense',
    'Transport',
    'Events & extracurricular activities',
    'Administrative expenses',
    'Miscellaneous'
  ];

  const fallbackIncomeCategories = [
    'Registration fees',
    'Tuition Fees',
    'Examination fees',
    'Internship fees',
    'Cafeteria income',
    'Donations, grants, and sponsorships',
    'Rent of Campus',
    'IT Boot camp',
    'Miscellaneous'
  ];

  const fetchCategories = async () => {
    try {
      const response = await fetchClient.get('/api/accounting/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchStudentsAndStaff = async () => {
    try {
      const [studentsRes, staffRes] = await Promise.all([
        fetchClient.get('/api/students?limit=100'),
        fetchClient.get('/api/staff?limit=100')
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.data || []);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.data || []);
      }
    } catch (err) {
      console.error('Error fetching students/staff:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // client-side validations
    if (!formData.category) {
      setError('Please select a category');
      showToast('Please select a category', 'error');
      setLoading(false);
      return;
    }
    const amt = parseFloat(String(formData.amount));
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount greater than 0');
      showToast('Please enter a valid amount greater than 0', 'error');
      setLoading(false);
      return;
    }
    // Ensure branch is provided when SuperAdmin is creating a transaction
    if (isSuperAdmin && !branch) {
      setError('Please select a branch');
      showToast('Please select a branch', 'error');
      setLoading(false);
      return;
    }
    try {
      const payload: any = {
        ...formData,
        category: typeof formData.category === 'string' ? formData.category.trim() : formData.category,
        amount: parseFloat(formData.amount),
        branch: isSuperAdmin ? branch : (currentBranch ? (currentBranch as any)._id || (currentBranch as any).id : undefined),
        linkedStudent: formData.linkedStudent || undefined,
        linkedStaff: formData.linkedStaff || undefined
      };
      // Only include categoryId when it looks like a real Mongo ObjectId (24 hex chars)
      if (formData.categoryId && /^[a-f\d]{24}$/.test(String(formData.categoryId))) {
        payload.categoryId = formData.categoryId;
      }

      const response = await fetchClient.post('/api/accounting', payload);
      
      if (response.ok) {
        setFormData({
          type: 'income',
          category: '',
          categoryId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          reference: '',
          paymentMethod: 'cash',
          linkedStudent: '',
          linkedStaff: ''
        });
        setIsOpen(false);
        onCreated?.();
      } else {
        // try to read server error body for debugging
        let errorData: any = null;
        try { errorData = await response.json(); } catch (e) { }
        console.error('Create transaction failed', response.status, errorData);
        const errorMsg = (errorData && (errorData.error || errorData.message)) || 'Failed to create transaction';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = 'Error creating transaction';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  let filteredCategories = categories.filter(cat => cat.type === formData.type);
  // If backend returned no categories, use fallback lists
  if (!filteredCategories || filteredCategories.length === 0) {
    filteredCategories = (formData.type === 'income' ? fallbackIncomeCategories : fallbackExpenseCategories).map((name, idx) => ({ _id: `fallback-${formData.type}-${idx}`, name, type: formData.type as 'income' | 'expense' } as Category));
  }

  useEffect(() => {
    // ensure branch state follows currentBranch when available
    if (!isSuperAdmin && currentBranch) {
      setBranch((currentBranch as any)._id || (currentBranch as any).id);
    }
  }, [currentBranch, isSuperAdmin]);

  // formatCurrency removed (unused) — kept formatting in other components

  // Determine whether to render the internal trigger button.
  // Default: show trigger when no explicit prop provided (legacy behavior).
  const shouldShowTrigger = typeof showTrigger === 'boolean' ? showTrigger : true;

  if (!isOpen && !initialData && shouldShowTrigger) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
      >
        <span className="w-4 h-4">+</span>
        <span>Add Transaction</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
        </div>
        {!initialData && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preview Summary */}
      {formData.amount && formData.category && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                formData.type === 'income' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-900">
                {formData.type === 'income' ? 'Income' : 'Expense'}: {formData.category}
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {formatXAF(parseFloat(formData.amount) || 0)}
            </span>
          </div>
          {formData.description && (
            <p className="text-sm text-gray-600 mt-2">{formData.description}</p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  type: 'income',
                  category: '', 
                  categoryId: '' 
                }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Income</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  type: 'expense',
                  category: '', 
                  categoryId: '' 
                }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Expense</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.categoryId || formData.category}
              onChange={(e) => {
                const val = e.target.value;
                const picked = filteredCategories.find(c => String(c._id) === val || c.name === val);
                const isFallback = picked && String(picked._id).startsWith('fallback-');
                setFormData(prev => ({ 
                  ...prev, 
                  categoryId: isFallback ? '' : (picked?._id || ''), 
                  category: picked?.name || val 
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {filteredCategories.map((category) => (
                <option key={category._id} value={(category._id && !String(category._id).startsWith('fallback-')) ? category._id : category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (XAF) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
            {formData.amount && (
              <p className="text-sm text-gray-500 mt-1">
                Amount: {formatXAF(parseFloat(formData.amount) || 0)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Transaction description..."
            />
          </div>
        </div>

        {/* Payment Method & Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional reference number"
            />
          </div>
        </div>

        {/* Linked Records */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span>Linked Student (Optional)</span>
              </div>
            </label>
            <select
              value={formData.linkedStudent}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedStudent: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No student linked</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.names || `${student.firstName} ${student.lastName}`} - {student.studentId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Linked Staff (Optional)</span>
              </div>
            </label>
            <select
              value={formData.linkedStaff}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedStaff: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No staff linked</option>
              {staff.map((staffMember) => (
                <option key={staffMember._id} value={staffMember._id}>
                  {staffMember.name} - {staffMember.role || 'Staff'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Branch Selection for SuperAdmin */}
        {isSuperAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Branch *</span>
              </div>
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Branch</option>
              {availableBranches.map((b: any) => (
                <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Current Branch Info for non-SuperAdmin */}
        {!isSuperAdmin && currentBranch && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Branch: {(currentBranch as any).name}
              </span>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{initialData ? 'Update' : 'Create'} Transaction</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;