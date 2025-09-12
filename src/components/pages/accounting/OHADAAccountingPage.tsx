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
  RefreshCw
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
  importOHADAJournalEntries
} from '../../../api/ohada';
import { OHADAAccount, OHADAJournalEntry, OHADAChartOfAccounts } from '../../../types/ohada';

const OHADAAccountingPage: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { showToast } = useUI();

  const [activeTab, setActiveTab] = useState<'journal' | 'accounts' | 'reports' | 'periods'>('journal');
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

  // Account Form State
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    description: '',
    parentCode: ''
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    accountType: '',
    dateFrom: '',
    dateTo: ''
  });

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

  const handleCreateJournalEntry = async () => {
    try {
      // Validate form
      if (!journalForm.reference || !journalForm.description) {
        showToast('Reference and description are required', 'error');
        return;
      }

      const validLines = journalForm.lines.filter(line => 
        line.account && (line.debit > 0 || line.credit > 0)
      );

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

      await createOHADAJournalEntry({
        ...journalForm,
        lines: validLines
      });

      setShowJournalForm(false);
      resetJournalForm();
      fetchJournalEntries();
      showToast('Journal entry created successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create journal entry', 'error');
    }
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
      showToast(error.message || 'Failed to post journal entry', 'error');
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
      case 'posted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'reversed': return <RefreshCw className="w-4 h-4 text-red-600" />;
      case 'draft': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800';
      case 'reversed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OHADA Accounting System</h1>
          <p className="text-gray-600 mt-1">Professional accounting following OHADA standards</p>
          {currentBranch && (
            <p className="text-sm text-blue-600 mt-1">Branch: {(currentBranch as any).name}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          <button
            onClick={() => setShowJournalForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'journal', name: 'Journal Entries', icon: <FileText className="w-4 h-4" /> },
              { id: 'accounts', name: 'Chart of Accounts', icon: <Calculator className="w-4 h-4" /> },
              { id: 'reports', name: 'Financial Reports', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'periods', name: 'Accounting Periods', icon: <Calendar className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Journal Entries Tab */}
          {activeTab === 'journal' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search entries..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="posted">Posted</option>
                    <option value="reversed">Reversed</option>
                  </select>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="From Date"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="To Date"
                  />
                </div>
              </div>

              {/* Journal Entries Table */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Journal Entries</h3>
                  <div className="flex items-center space-x-2">
                    <label className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 cursor-pointer flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Import</span>
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImportJournalEntries(file);
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => handleExportReport('trial_balance', 'excel')}
                      className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
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
                      {journalEntries.map((entry) => (
                        <tr key={entry._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {entry.entryNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.reference}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {entry.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatXAF(entry.totalDebit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                              {getStatusIcon(entry.status)}
                              <span className="ml-1 capitalize">{entry.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {entry.status === 'draft' && (
                                <>
                                  <button
                                    className="text-green-600 hover:text-green-900"
                                    title="Edit Entry"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handlePostJournalEntry(entry._id)}
                                    className="text-purple-600 hover:text-purple-900"
                                    title="Post Entry"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Chart of Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">OHADA Chart of Accounts</h3>
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              </div>

              {/* Accounts Tree View */}
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">All Types</option>
                      <option value="asset">Assets</option>
                      <option value="liability">Liabilities</option>
                      <option value="equity">Equity</option>
                      <option value="income">Income</option>
                      <option value="expense">Expenses</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
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
                      {accounts.map((account) => (
                        <tr key={account._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {account.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm text-gray-900 ${account.level > 1 ? `ml-${(account.level - 1) * 4}` : ''}`}>
                              {account.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              account.type === 'asset' ? 'bg-blue-100 text-blue-800' :
                              account.type === 'liability' ? 'bg-red-100 text-red-800' :
                              account.type === 'equity' ? 'bg-purple-100 text-purple-800' :
                              account.type === 'income' ? 'bg-green-100 text-green-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {account.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatXAF(account.balance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">OHADA Financial Reports</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Trial Balance */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Calculator className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Trial Balance</h4>
                      <p className="text-sm text-gray-600">Account balances summary</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExportReport('trial_balance', 'excel')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Export Excel
                    </button>
                    <button
                      onClick={() => handleExportReport('trial_balance', 'pdf')}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Export PDF
                    </button>
                  </div>
                </div>

                {/* Balance Sheet */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Balance Sheet</h4>
                      <p className="text-sm text-gray-600">Assets, liabilities & equity</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExportReport('balance_sheet', 'excel')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Export Excel
                    </button>
                    <button
                      onClick={() => handleExportReport('balance_sheet', 'pdf')}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Export PDF
                    </button>
                  </div>
                </div>

                {/* Income Statement */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Income Statement</h4>
                      <p className="text-sm text-gray-600">Revenue & expenses</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExportReport('income_statement', 'excel')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Export Excel
                    </button>
                    <button
                      onClick={() => handleExportReport('income_statement', 'pdf')}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Journal Entry Form Modal */}
      {showJournalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Journal Entry</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Entry Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={journalForm.date}
                    onChange={(e) => setJournalForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference *</label>
                  <input
                    type="text"
                    value={journalForm.reference}
                    onChange={(e) => setJournalForm(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Invoice #, Receipt #, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <input
                    type="text"
                    value={journalForm.description}
                    onChange={(e) => setJournalForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction description"
                    required
                  />
                </div>
              </div>

              {/* Journal Lines */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Journal Lines</h4>
                  <button
                    onClick={addJournalLine}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {journalForm.lines.map((line, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <select
                              value={line.account}
                              onChange={(e) => updateJournalLine(index, 'account', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              <option value="">Select Account</option>
                              {accounts.map((account) => (
                                <option key={account._id} value={account._id}>
                                  {account.code} - {account.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Line description"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={line.debit}
                              onChange={(e) => updateJournalLine(index, 'debit', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={line.credit}
                              onChange={(e) => updateJournalLine(index, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeJournalLine(index)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove Line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">
                          TOTALS
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {formatXAF(totals.totalDebits)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {formatXAF(totals.totalCredits)}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center space-x-2 ${
                            totals.isBalanced ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {totals.isBalanced ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            <span className="text-xs font-medium">
                              {totals.isBalanced ? 'Balanced' : `Diff: ${formatXAF(Math.abs(totals.difference))}`}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowJournalForm(false);
                  resetJournalForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJournalEntry}
                disabled={!totals.isBalanced}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OHADAAccountingPage;