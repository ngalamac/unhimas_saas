import React, { useState } from 'react';

// Transaction type
interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string; // ISO string
  source: 'Tuition' | 'Fees' | 'Other Income' | 'Expense';
}

// Mock data from different sources
const tuitionPayments: Transaction[] = [
  { id: 1, type: 'income', amount: 1200, description: 'Tuition - John Doe', date: '2025-08-01T09:00', source: 'Tuition' },
  { id: 2, type: 'income', amount: 1200, description: 'Tuition - Jane Smith', date: '2025-08-02T10:00', source: 'Tuition' },
];
const feePayments: Transaction[] = [
  { id: 3, type: 'income', amount: 200, description: 'Library Fee - John Doe', date: '2025-08-01T09:30', source: 'Fees' },
  { id: 4, type: 'income', amount: 150, description: 'Lab Fee - Jane Smith', date: '2025-08-02T10:30', source: 'Fees' },
];
const otherIncome: Transaction[] = [
  { id: 5, type: 'income', amount: 500, description: 'Donation', date: '2025-08-03T11:00', source: 'Other Income' },
];
const expenses: Transaction[] = [
  { id: 6, type: 'expense', amount: 300, description: 'Stationery Purchase', date: '2025-08-04T12:00', source: 'Expense' },
  { id: 7, type: 'expense', amount: 400, description: 'Staff Salary', date: '2025-08-05T13:00', source: 'Expense' },
];

const initialTransactions: Transaction[] = [
  ...tuitionPayments,
  ...feePayments,
  ...otherIncome,
  ...expenses,
];

const AccountingPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
  });
  const [reportType, setReportType] = useState<'balance' | 'income'>('balance');
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showReport, setShowReport] = useState(false);

  // Add transaction
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        type: form.type as 'income' | 'expense',
        amount: parseFloat(form.amount),
        description: form.description,
        date: form.date,
        source: form.type === 'income' ? 'Other Income' : 'Expense', // Manual entries
      },
    ]);
    setForm({ type: 'income', amount: '', description: '', date: new Date().toISOString().slice(0, 16) });
  };

  // Filter transactions by date range
  const filtered = transactions.filter((t) => {
    if (!dateRange.from || !dateRange.to) return true;
    return t.date >= dateRange.from && t.date <= dateRange.to;
  });

  // Grouped analytics
  const sources = ['Tuition', 'Fees', 'Other Income', 'Expense'] as const;
  const grouped = sources.map(source => {
    const items = filtered.filter(t => t.source === source);
    const total = items.reduce((sum, t) => sum + t.amount, 0);
    return { source, total, items };
  });

  const totalIncome = grouped.filter(g => g.source !== 'Expense').reduce((sum, g) => sum + g.total, 0);
  const totalExpense = grouped.find(g => g.source === 'Expense')?.total || 0;
  const balance = totalIncome - totalExpense;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Accounting</h2>
      {/* Transaction Form */}
      <form onSubmit={handleAddTransaction} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border rounded p-2 w-full">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input type="number" required min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="border rounded p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input type="text" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date & Time</label>
          <input type="datetime-local" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="border rounded p-2 w-full" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-4 md:mt-0">Add</button>
      </form>

      {/* Grouped Analytics Table */}
      <h3 className="text-lg font-semibold mb-2">Analytics by Source</h3>
      <table className="min-w-full bg-white border rounded mb-6">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Source</th>
            <th className="py-2 px-4 border-b">Total</th>
            <th className="py-2 px-4 border-b">Details</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(g => (
            <tr key={g.source}>
              <td className="py-2 px-4 border-b font-semibold">{g.source}</td>
              <td className={`py-2 px-4 border-b ${g.source === 'Expense' ? 'text-red-600' : 'text-green-600'}`}>{g.total.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD' })}</td>
              <td className="py-2 px-4 border-b">
                {g.items.length === 0 ? <span className="text-gray-400">No records</span> : (
                  <ul className="list-disc ml-4">
                    {g.items.map(item => (
                      <li key={item.id}>
                        {item.description} ({item.amount.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD' })})
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Transactions Table (all records) */}
      <h3 className="text-lg font-semibold mb-2">All Transactions</h3>
      <table className="min-w-full bg-white border rounded mb-6">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Type</th>
            <th className="py-2 px-4 border-b">Source</th>
            <th className="py-2 px-4 border-b">Amount</th>
            <th className="py-2 px-4 border-b">Description</th>
            <th className="py-2 px-4 border-b">Date & Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
            <tr key={t.id}>
              <td className="py-2 px-4 border-b">{t.type === 'income' ? (language === 'fr' ? 'Revenu' : 'Income') : (language === 'fr' ? 'Dépense' : 'Expense')}</td>
              <td className="py-2 px-4 border-b">{t.source}</td>
              <td className="py-2 px-4 border-b">{t.amount.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD' })}</td>
              <td className="py-2 px-4 border-b">{t.description}</td>
              <td className="py-2 px-4 border-b">{new Date(t.date).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="text-lg font-semibold mb-2">Generate Report</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Report Type</label>
          <select value={reportType} onChange={e => setReportType(e.target.value as 'balance' | 'income')} className="border rounded p-2 w-full">
            <option value="balance">Balance Sheet</option>
            <option value="income">Income Statement</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value as 'en' | 'fr')} className="border rounded p-2 w-full">
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <input type="datetime-local" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} className="border rounded p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <input type="datetime-local" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} className="border rounded p-2 w-full" />
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded mt-4 md:mt-0" onClick={() => setShowReport(true)}>Generate</button>
      </div>

      {/* Report Display */}
      {showReport && (
        <div className="bg-gray-50 border rounded p-4 mt-4">
          <h4 className="text-xl font-bold mb-2">
            {reportType === 'balance'
              ? language === 'fr' ? 'Bilan' : 'Balance Sheet'
              : language === 'fr' ? 'Compte de Résultat' : 'Income Statement'}
          </h4>
          <table className="min-w-full bg-white border rounded mb-2">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">{language === 'fr' ? 'Type' : 'Type'}</th>
                <th className="py-2 px-4 border-b">{language === 'fr' ? 'Montant' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b">{language === 'fr' ? 'Revenu Total' : 'Total Income'}</td>
                <td className="py-2 px-4 border-b">{totalIncome.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD' })}</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">{language === 'fr' ? 'Dépense Totale' : 'Total Expense'}</td>
                <td className="py-2 px-4 border-b">{totalExpense.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD' })}</td>
              </tr>
              {reportType === 'balance' && (
                <tr>
                  <td className="py-2 px-4 border-b font-bold">{language === 'fr' ? 'Solde' : 'Balance'}</td>
                  <td className="py-2 px-4 border-b font-bold">{balance.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD' })}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccountingPage;
