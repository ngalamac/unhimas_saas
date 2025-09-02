import React, { useEffect, useState } from 'react';

interface Account {
  _id?: string;
  name: string;
  code?: string;
  type: string;
  description?: string;
}

export const ChartOfAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('asset');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch('/api/accounts');
    if (res.ok) setAccounts(await res.json());
  };

  const create = async () => {
    if (!name) return;
    const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type }) });
    if (res.ok) { setName(''); setType('asset'); fetchAccounts(); }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Chart of Accounts</h1>
      <div className="mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" className="border p-2 mr-2" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2 mr-2">
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
          <option value="equity">Equity</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button onClick={create} className="bg-blue-600 text-white px-3 py-2 rounded">Create</button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a._id}>
                <td className="py-2">{a.name}</td>
                <td>{a.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChartOfAccountsPage;
