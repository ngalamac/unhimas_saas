import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  TrendingUp,
  Database,
  Settings,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Save,
  X,
  School
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import { formatXAF } from '../../../utils/currency';
import {
  getOHADAAccounts,
  getOHADAJournalEntries,
  createOHADAJournalEntry,
  postOHADAJournalEntry,
  getOHADATrialBalance,
  getOHADABalanceSheet,
  getOHADAIncomeStatement,
  exportOHADAReport,
  importOHADAJournalEntries,
  createOHADAAccount
} from '../../../api/ohada';
import { OHADAAccount, OHADAJournalEntry, OHADAChartOfAccounts } from '../../../types/ohada';
import OHADAReportsPage from './OHADAReportsPage';

type TabType = 'accounts' | 'journal' | 'reports' | 'periods' | 'budgets';
type SubTabType = 'general' | 'tuition';

const OHADAAccountingPage: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch, managedBranches } = useBranch();
  const { showToast } = useUI();

  const [activeTab, setActiveTab] = useState<'journal' | 'accounts' | 'reports' | 'periods'>('journal');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('general');
  const [accounts, setAccounts] = useState<OHADAAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<OHADAJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Journal Entry Form State
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { account: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
      { account: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
    ]
  });
  // For super admin explicit branch selection in journal modal
  const [journalBranchId, setJournalBranchId] = useState<string>(() => (currentBranch as any)?._id || '');
  useEffect(() => {
    // Sync default when modal opens or branch context changes
    if (!showJournalForm) return;
    if (currentBranch?._id && !journalBranchId) setJournalBranchId(currentBranch._id);
  }, [currentBranch, showJournalForm]);

  // Account Form State
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    description: '',
    parentCode: '',
    type: 'asset'
  });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const deriveTypeFromCode = (code: string) => {
    if (!code) return { type: '-', category: '-' };
    const first = code.charAt(0);
    switch (first) {
      case '1': return { type: 'equity', category: 'non-current' };
      case '2': return { type: 'asset', category: 'non-current' };
      case '3': return { type: 'asset', category: 'current' };
      case '4': return { type: (code.startsWith('41') || code.startsWith('46')) ? 'asset' : 'liability', category: 'current' };
      case '5': return { type: 'asset', category: 'current' };
      case '6': {
        if (code.startsWith('64') || code.startsWith('65')) return { type: 'expense', category: 'financial' };
        if (code.startsWith('69')) return { type: 'expense', category: 'extraordinary' };
        return { type: 'expense', category: 'operating' };
      }
      case '7': {
        if (code.startsWith('74') || code.startsWith('75')) return { type: 'income', category: 'financial' };
        if (code.startsWith('79')) return { type: 'income', category: 'extraordinary' };
        return { type: 'income', category: 'operating' };
      }
      case '8': return { type: 'asset', category: 'extraordinary' };
      default: return { type: '-', category: '-' };
    }
  };
  const derived = deriveTypeFromCode(accountForm.code.trim());
  const mismatch = derived.type !== '-' && derived.type !== accountForm.type;

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    accountType: '',
    dateFrom: '',
    dateTo: ''
  });

  const tabs = [
    {
      id: 'accounts' as TabType,
      name: 'Chart of Accounts',
      icon: <Calculator className="w-4 h-4" />,
      description: 'Manage OHADA chart of accounts and account structure'
    },
    {
      id: 'journal' as TabType,
      name: 'Journal Entries',
      icon: <FileText className="w-4 h-4" />,
      description: 'Create and manage journal entries with automatic posting'
    },
    {
      id: 'reports' as TabType,
      name: 'Financial Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Generate OHADA-compliant financial statements and reports'
    },
    {
      id: 'periods' as TabType,
      name: 'Accounting Periods',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Manage accounting periods and year-end closing'
    },
    {
      id: 'budgets' as TabType,
      name: 'Budget Management',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Budget planning and variance analysis'
    }
  ];

  const subTabs = [
    {
      id: 'general' as SubTabType,
      name: 'General Accounting',
      description: 'Standard OHADA accounting operations'
    },
    {
      id: 'tuition' as SubTabType,
      name: 'Tuition Integration',
      description: 'Student tuition payments and OHADA integration'
    }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, currentBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAccounts(),
        fetchJournalEntries()
      ]);
    } catch (error) {
      console.error('Failed to fetch OHADA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await getOHADAAccounts();
      setAccounts(response.data);
    } catch (error: any) {
      showToast('Failed to load chart of accounts', 'error');
    }
  };

  const fetchJournalEntries = async () => {
    try {
      const response = await getOHADAJournalEntries({
        period: selectedPeriod,
        search: filters.search,
        status: filters.status
      });
      setJournalEntries(response.data);
    } catch (error: any) {
      showToast('Failed to load journal entries', 'error');
    }
  };

  const resetAccountForm = () => {
    setAccountForm({ code: '', name: '', description: '', parentCode: '', type: 'asset' });
  };

  const handleCreateAccount = async () => {
    if (!accountForm.code || !accountForm.name) {
      showToast('Code and Name are required', 'error');
      return;
    }
    try {
      setCreatingAccount(true);
      const payload: any = { ...accountForm };
      if (!payload.parentCode) delete payload.parentCode;
      // Super admin may need to specify branch (use currentBranch if available)
      if ((user as any)?.isSuperAdmin && currentBranch?._id) {
        payload.branch = currentBranch._id;
      }
      await createOHADAAccount(payload);
      showToast(`Account ${payload.code} created`, 'success');
      setShowAccountForm(false);
      resetAccountForm();
      // refresh accounts list
      await fetchAccounts();
    } catch (e: any) {
      console.error('Failed to create account', e);
      const serverMsg = e?.message && typeof e.message === 'string' ? e.message : 'Failed to create account';
      showToast(serverMsg, 'error');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleCreateJournalEntry = async () => {
    try {
      // Validate form
      if (!journalForm.reference || !journalForm.description) {
        showToast('Reference and description are required', 'error');
        return;
      }

      // Frontend line validation: collect issues for better UX
      const lineIssues: string[] = [];
      journalForm.lines.forEach((line, idx) => {
        if (!line.account) {
          lineIssues.push(`Line ${idx + 1}: account not selected`);
        }
        if ((line.debit || 0) === 0 && (line.credit || 0) === 0) {
          lineIssues.push(`Line ${idx + 1}: debit or credit required`);
        }
        if ((line.debit || 0) > 0 && (line.credit || 0) > 0) {
          lineIssues.push(`Line ${idx + 1}: cannot have both debit and credit > 0`);
        }
      });

      if (lineIssues.length) {
        showToast(lineIssues.slice(0,3).join(' | ') + (lineIssues.length>3 ? ` (+${lineIssues.length-3} more)` : ''), 'error');
        return;
      }

      const validLines = journalForm.lines.filter(line => line.account && ((line.debit || 0) > 0 || (line.credit || 0) > 0));

      if (validLines.length < 2) {
        showToast('At least 2 journal lines are required', 'error');
        return;
      }

      const totalDebits = validLines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredits = validLines.reduce((sum, line) => sum + line.credit, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        showToast('Debits must equal credits', 'error');
        return;
      }

      // Branch requirement: backend now enforces branch. For super admin select currentBranch.
      const journalPayload: any = {
        ...journalForm,
        lines: validLines
      };
      if ((user as any)?.isSuperAdmin) {
        if (!journalBranchId) {
          showToast('Select a branch before creating a journal entry', 'error');
          return;
        }
        journalPayload.branch = journalBranchId;
      } else if (!journalPayload.branch) {
        // Non super admin: default to their context branch if available
        if (currentBranch?._id) {
          journalPayload.branch = (currentBranch as any)._id;
        }
      }

      await createOHADAJournalEntry(journalPayload);

      setShowJournalForm(false);
      resetJournalForm();
      fetchJournalEntries();
      showToast('Journal entry created successfully', 'success');
    } catch (error: any) {
      // Backend now returns shapes:
      // { error: { message: 'One or more accounts not found', missingAccounts: [...] } }
      // { error: { message: 'Validation failed', fieldErrors: { period: '...', branch: '...' } } }
      // { error: { message: 'Debits must equal credits' } }
      // Generic network / other errors
      const errObj = error?.response?.data?.error;
      let msg = 'Failed to create journal entry';
      if (errObj) {
        if (errObj.missingAccounts && Array.isArray(errObj.missingAccounts)) {
          msg = `${errObj.message}: ${errObj.missingAccounts.join(', ')}`;
        } else if (errObj.fieldErrors) {
          const fieldMsgs = Object.entries(errObj.fieldErrors).map(([f, m]) => `${f}: ${m}`);
            msg = fieldMsgs.slice(0,3).join(' | ') + (fieldMsgs.length>3 ? ` (+${fieldMsgs.length-3} more)` : '');
        } else if (errObj.message) {
          msg = errObj.message;
        }
      } else if (error.message) {
        msg = error.message;
      }
      showToast(msg, 'error');
    }
  };

  // ...existing code...

  const renderBranchSelectForJournal = () => {
    if (!(user as any)?.isSuperAdmin) return null;
    return (
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Branch<span className="text-red-500">*</span></label>
        <select
          value={journalBranchId}
          onChange={e => setJournalBranchId(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          <option value="">-- Select Branch --</option>
          {managedBranches.map(b => (
            <option key={(b as any)._id || (b as any).id} value={(b as any)._id || (b as any).id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const handlePostJournalEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to post this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      await postOHADAJournalEntry(entryId);
      fetchJournalEntries();
      fetchAccounts(); // Refresh account balances
      showToast('Journal entry posted successfully', 'success');
    } catch (error: any) {
      const errObj = error?.response?.data?.error;
      const msg = errObj?.message || error.message || 'Failed to post journal entry';
      showToast(msg, 'error');
    }
  };

  const handleExportReport = async (reportType: 'trial_balance' | 'balance_sheet' | 'income_statement', format: 'excel' | 'pdf' | 'csv') => {
    try {
      const blob = await exportOHADAReport(
        reportType, 
        selectedPeriod, 
        format,
        currentBranch ? (currentBranch as any)._id : undefined
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ohada-${reportType}-${selectedPeriod}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`${reportType.replace('_', ' ')} exported successfully`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export report', 'error');
    }
  };

  const handleImportJournalEntries = async (file: File) => {
    try {
      const response = await importOHADAJournalEntries(file);
      showToast(`Imported ${response.data.imported} journal entries`, 'success');
      if (response.data.errors.length > 0) {
        console.warn('Import errors:', response.data.errors);
      }
      fetchJournalEntries();
    } catch (error: any) {
      showToast(error.message || 'Failed to import journal entries', 'error');
    }
  };

  const resetJournalForm = () => {
    setJournalForm({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { account: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
        { account: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
      ]
    });
  };

  const addJournalLine = () => {
    setJournalForm(prev => ({
      ...prev,
      lines: [...prev.lines, { account: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }]
    }));
  };

  const removeJournalLine = (index: number) => {
    if (journalForm.lines.length <= 2) {
      showToast('Minimum 2 lines required', 'warning');
      return;
    }
    
    setJournalForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const updateJournalLine = (index: number, field: string, value: any) => {
    setJournalForm(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => {
        if (i === index) {
          const updatedLine = { ...line, [field]: value };
          
          // Auto-populate account details when account is selected
          if (field === 'account') {
            const selectedAccount = accounts.find(acc => acc._id === value);
            if (selectedAccount) {
              updatedLine.accountCode = selectedAccount.code;
              updatedLine.accountName = selectedAccount.name;
            }
          }
          
          return updatedLine;
        }
        return line;
      })
    }));
  };

  const calculateTotals = () => {
    const totalDebits = journalForm.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = journalForm.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const difference = totalDebits - totalCredits;
    
    return { totalDebits, totalCredits, difference, isBalanced: Math.abs(difference) < 0.01 };
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-300" />;
    }
  };

  // Full page UI
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OHADA Accounting</h1>
          {currentBranch && (
            <p className="text-sm text-blue-600 mt-1">Branch: {(currentBranch as any).name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1">{getStatusIcon('posted')} Posted</span>
          <span className="flex items-center gap-1">{getStatusIcon('pending')} Pending</span>
          <span className="flex items-center gap-1">{getStatusIcon('draft')} Draft</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 pt-4">
          <div className="flex items-center gap-6">
            {[
              { id: 'journal', name: 'Journal Entries', icon: <FileText className="w-4 h-4" /> },
              { id: 'accounts', name: 'Chart of Accounts', icon: <Calculator className="w-4 h-4" /> },
              { id: 'reports', name: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'periods', name: 'Periods', icon: <Calendar className="w-4 h-4" /> }
            ].map((t: any) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 py-3 border-b-2 -mb-px ${
                  activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {t.icon}
                <span className="text-sm font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          {/* Journal Tab */}
          {activeTab === 'journal' && (
            <div className="space-y-6">
              {/* Filters and actions */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={filters.search}
                      onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search reference/description..."
                      className="pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-2 py-2 border rounded-lg text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="posted">Posted</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                  </select>
                  <button
                    onClick={fetchJournalEntries}
                    className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJournalForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" /> New Entry
                  </button>
                </div>
              </div>

              {/* Journal entries table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {journalEntries.map((e: any) => {
                        const totals = {
                          debit: (e.lines || []).reduce((s: number, l: any) => s + (l.debit || 0), 0),
                          credit: (e.lines || []).reduce((s: number, l: any) => s + (l.credit || 0), 0)
                        };
                        return (
                          <tr key={e._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.reference || '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{e.description || '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs">
                                {getStatusIcon(e.status || 'draft')}
                                <span className="capitalize">{e.status || 'draft'}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatXAF(totals.debit)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatXAF(totals.credit)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {(e.status !== 'posted') && (
                                <button
                                  onClick={() => handlePostJournalEntry(e._id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-gray-50"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" /> Post
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {journalEntries.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No journal entries found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Journal Entry Modal */}
              {showJournalForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-semibold">New Journal Entry</h3>
                      <button onClick={() => setShowJournalForm(false)} className="text-gray-500 hover:text-gray-700 p-2 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-4 space-y-4 overflow-y-auto">
                      {(user as any)?.isSuperAdmin && renderBranchSelectForJournal()}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Date</label>
                          <input type="date" value={journalForm.date} onChange={e => setJournalForm({ ...journalForm, date: e.target.value })} className="w-full border rounded px-2 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Reference</label>
                          <input value={journalForm.reference} onChange={e => setJournalForm({ ...journalForm, reference: e.target.value })} className="w-full border rounded px-2 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <input value={journalForm.description} onChange={e => setJournalForm({ ...journalForm, description: e.target.value })} className="w-full border rounded px-2 py-2" />
                        </div>
                      </div>

                      {/* Lines */}
                      <div className="border rounded">
                        <div className="p-3 border-b flex items-center justify-between">
                          <h4 className="font-medium">Lines</h4>
                          <button onClick={addJournalLine} className="inline-flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-gray-50">
                            <Plus className="w-4 h-4" /> Add line
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left">Account</th>
                                <th className="px-3 py-2 text-left">Description</th>
                                <th className="px-3 py-2 text-right">Debit</th>
                                <th className="px-3 py-2 text-right">Credit</th>
                                <th className="px-3 py-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {journalForm.lines.map((line, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="px-3 py-2">
                                    <select
                                      value={line.account}
                                      onChange={e => updateJournalLine(idx, 'account', e.target.value)}
                                      className="w-full border rounded px-2 py-1"
                                    >
                                      <option value="">-- Select account --</option>
                                      {accounts.map((a) => (
                                        <option key={(a as any)._id} value={(a as any)._id}>{a.code} - {a.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input value={line.description} onChange={e => updateJournalLine(idx, 'description', e.target.value)} className="w-full border rounded px-2 py-1" />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <input type="number" value={line.debit} onChange={e => updateJournalLine(idx, 'debit', Number(e.target.value))} className="w-28 border rounded px-2 py-1 text-right" />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <input type="number" value={line.credit} onChange={e => updateJournalLine(idx, 'credit', Number(e.target.value))} className="w-28 border rounded px-2 py-1 text-right" />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button onClick={() => removeJournalLine(idx)} className="px-2 py-1 border rounded hover:bg-gray-50">Remove</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-3 border-t flex items-center justify-end gap-4 text-sm">
                          {(() => {
                            const t = calculateTotals();
                            return (
                              <>
                                <span>Total Debit: <span className="font-semibold">{formatXAF(t.totalDebits)}</span></span>
                                <span>Total Credit: <span className="font-semibold">{formatXAF(t.totalCredits)}</span></span>
                                <span className={t.isBalanced ? 'text-green-600' : 'text-red-600'}>
                                  {t.isBalanced ? 'Balanced' : `Diff ${formatXAF(Math.abs(t.difference))}`}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t flex items-center justify-end gap-2">
                      <button onClick={() => setShowJournalForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                      <button onClick={handleCreateJournalEntry} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Entry
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Chart of Accounts</h3>
                  <p className="text-sm text-gray-600">Manage your OHADA accounts</p>
                </div>
                <button onClick={() => setShowAccountForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> New Account
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accounts.map((a: any) => (
                        <tr key={(a as any)._id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-mono text-sm">{a.code}</td>
                          <td className="px-6 py-3 text-sm">{a.name}</td>
                          <td className="px-6 py-3 text-sm capitalize">{a.type || '—'}</td>
                          <td className="px-6 py-3 text-sm">{a.parentCode || '—'}</td>
                        </tr>
                      ))}
                      {accounts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">No accounts found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Account Modal */}
              {showAccountForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-semibold">New Account</h3>
                      <button onClick={() => setShowAccountForm(false)} className="text-gray-500 hover:text-gray-700 p-2 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Code</label>
                          <input value={accountForm.code} onChange={e => setAccountForm({ ...accountForm, code: e.target.value })} className="w-full border rounded px-2 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <input value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} className="w-full border rounded px-2 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <select value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })} className="w-full border rounded px-2 py-2">
                            <option value="asset">Asset</option>
                            <option value="liability">Liability</option>
                            <option value="equity">Equity</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Parent Code</label>
                          <input value={accountForm.parentCode} onChange={e => setAccountForm({ ...accountForm, parentCode: e.target.value })} className="w-full border rounded px-2 py-2" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea value={accountForm.description} onChange={e => setAccountForm({ ...accountForm, description: e.target.value })} rows={3} className="w-full border rounded px-2 py-2" />
                      </div>
                      {mismatch && (
                        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                          Hint: Code suggests {derived.type} ({derived.category}).
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t flex items-center justify-end gap-2">
                      <button onClick={() => setShowAccountForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                      <button onClick={handleCreateAccount} disabled={creatingAccount} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Save className="w-4 h-4" /> {creatingAccount ? 'Creating...' : 'Create Account'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <OHADAReportsPage />
          )}

          {/* Periods Tab */}
          {activeTab === 'periods' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Accounting Period</h3>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    return (
                      <option key={period} value={period}>
                        {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </option>
                    );
                  })}
                </select>
                <button onClick={fetchData} className="inline-flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OHADAAccountingPage;