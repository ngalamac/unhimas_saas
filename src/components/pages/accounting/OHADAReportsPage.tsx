import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calculator, 
  TrendingUp, 
  Download, 
  FileText,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import { formatXAF } from '../../../utils/currency';
import {
  getOHADATrialBalance,
  getOHADABalanceSheet,
  getOHADAIncomeStatement,
  exportOHADAReport
} from '../../../api/ohada';
import { OHADATrialBalance, OHADABalanceSheet, OHADAIncomeStatement } from '../../../types/ohada';

const OHADAReportsPage: React.FC = () => {
  useAuth(); // initialize auth context if needed (no local vars to avoid unused warnings)
  const { currentBranch } = useBranch();
  const { showToast } = useUI();

  const [selectedReport, setSelectedReport] = useState<'trial_balance' | 'balance_sheet' | 'income_statement'>('trial_balance');
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const reportTypes = [
    {
      id: 'trial_balance',
      name: 'Trial Balance',
      description: 'Summary of all account balances',
      icon: <Calculator className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'balance_sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'income_statement',
      name: 'Income Statement',
      description: 'Revenue and expenses',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const branchId = currentBranch ? (currentBranch as any)._id : undefined;

      switch (selectedReport) {
        case 'trial_balance':
          const tbResponse = await getOHADATrialBalance(selectedPeriod, branchId);
          setReportData(tbResponse.data);
          break;
        case 'balance_sheet':
          const bsResponse = await getOHADABalanceSheet(selectedPeriod, branchId);
          setReportData(bsResponse.data);
          break;
        case 'income_statement':
          const isResponse = await getOHADAIncomeStatement(selectedPeriod, branchId);
          setReportData(isResponse.data);
          break;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
  const blob = await exportOHADAReport(
        selectedReport,
        selectedPeriod,
        format,
        currentBranch ? (currentBranch as any)._id : undefined
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ohada-${selectedReport}-${selectedPeriod}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Report exported successfully`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export report', 'error');
    }
  };

  const renderTrialBalance = (data: OHADATrialBalance) => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Trial Balance - {data.period}</h3>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closing Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closing Credit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(data?.accounts || []).map((account, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {account.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatXAF(account.openingDebit || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatXAF(account.openingCredit || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatXAF(account.periodDebit || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatXAF(account.periodCredit || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatXAF(account.closingDebit || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatXAF(account.closingCredit || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                  TOTALS
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {formatXAF(data?.totals?.openingDebit || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {formatXAF(data?.totals?.openingCredit || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {formatXAF(data?.totals?.periodDebit || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {formatXAF(data?.totals?.periodCredit || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {formatXAF(data?.totals?.closingDebit || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {formatXAF(data?.totals?.closingCredit || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBalanceSheet = (data: OHADABalanceSheet) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">ASSETS</h3>
          </div>
          <div className="p-4 space-y-4">
      {/* Non-Current Assets */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Non-Current Assets</h4>
              <div className="space-y-1">
        {(data?.assets?.nonCurrentAssets || []).map((asset, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{asset.code} - {asset.name}</span>
                    <span className="font-medium">{formatXAF(asset.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

      {/* Current Assets */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Assets</h4>
              <div className="space-y-1">
        {(data?.assets?.currentAssets || []).map((asset, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{asset.code} - {asset.name}</span>
                    <span className="font-medium">{formatXAF(asset.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL ASSETS</span>
                <span>{formatXAF(data?.assets?.totalAssets || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">LIABILITIES & EQUITY</h3>
          </div>
          <div className="p-4 space-y-4">
      {/* Equity */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Equity</h4>
              <div className="space-y-1">
        {(data?.liabilitiesAndEquity?.equity || []).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.code} - {item.name}</span>
                    <span className="font-medium">{formatXAF(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

      {/* Non-Current Liabilities */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Non-Current Liabilities</h4>
              <div className="space-y-1">
        {(data?.liabilitiesAndEquity?.nonCurrentLiabilities || []).map((liability, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{liability.code} - {liability.name}</span>
                    <span className="font-medium">{formatXAF(liability.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

      {/* Current Liabilities */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Liabilities</h4>
              <div className="space-y-1">
        {(data?.liabilitiesAndEquity?.currentLiabilities || []).map((liability, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{liability.code} - {liability.name}</span>
                    <span className="font-medium">{formatXAF(liability.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span>{formatXAF(data?.liabilitiesAndEquity?.totalLiabilitiesAndEquity || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIncomeStatement = (data: OHADAIncomeStatement) => {
    const safeRevenue = data?.revenue || [];
    const safeExpenses = data?.expenses || [];
    const totalRevenue = typeof data?.totalRevenue === 'number' ? data.totalRevenue : safeRevenue.reduce((s, r) => s + (r?.amount || 0), 0);
    const totalExpenses = typeof data?.totalExpenses === 'number' ? data.totalExpenses : safeExpenses.reduce((s, e) => s + (e?.amount || 0), 0);
    const netProfit = typeof data?.netProfit === 'number' ? data.netProfit : (totalRevenue - totalExpenses);

    return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Income Statement - {data?.period || ''}</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Revenue */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">REVENUE</h4>
            <div className="space-y-2">
              {safeRevenue.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{item.code} - {item.name}</span>
                  <span className="font-medium">{formatXAF(item.amount || 0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Revenue</span>
                <span>{formatXAF(totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">EXPENSES</h4>
            <div className="space-y-2">
              {safeExpenses.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{item.code} - {item.name}</span>
                  <span className="font-medium">{formatXAF(item.amount || 0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Expenses</span>
                <span>{formatXAF(totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="border-t border-gray-300 pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>NET PROFIT</span>
              <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatXAF(netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OHADA Financial Reports</h1>
          <p className="text-gray-600 mt-1">Professional financial reporting following OHADA standards</p>
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
            onClick={fetchReportData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id as any)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedReport === report.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${report.color}`}>
                {report.icon}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {reportTypes.find(r => r.id === selectedReport)?.name} - {selectedPeriod}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('excel')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading report data...</span>
            </div>
          ) : reportData ? (
            <>
              {selectedReport === 'trial_balance' && renderTrialBalance(reportData)}
              {selectedReport === 'balance_sheet' && renderBalanceSheet(reportData)}
              {selectedReport === 'income_statement' && renderIncomeStatement(reportData)}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No data available for the selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OHADAReportsPage;