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
      case 'posted': return <CheckCircle className="w-4 h-4 text