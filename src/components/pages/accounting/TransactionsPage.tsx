import React, { useEffect, useState } from 'react';
import TransactionForm from './TransactionForm';

type Tx = {
  _id: string;
  date: string;
  category: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  registeredBy?: { name?: string } | string;
};

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ category: '', from: '', to: '' });

  const fetchPage = async (p = 1) => {
    const q = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (filters.category) q.set('category', filters.category);
    if (filters.from) q.set('from', filters.from);
    if (filters.to) q.set('to', filters.to);
    const res = await fetch(`/api/accounting?${q.toString()}`);
    if (!res.ok) throw new Error('Failed');
    const j = await res.json();
    setTransactions(j.data || []);
    setTotal(j.meta?.total || 0);
  };

  useEffect(() => { fetchPage(1).catch(() => {}); }, [filters]);

  const onCreated = () => { fetchPage(1).catch(()=>{}); };

  const runningBalance = () => {
    let bal = 0;
    return transactions.map(t => {
      bal += t.type === 'income' ? t.amount : -t.amount;
      return { ...t, balance: bal };
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Transactions</h1>
  <TransactionForm onCreated={onCreated} />
  <div className="mb-2 flex space-x-2">
        <input placeholder="Category" value={filters.category} onChange={(e)=>setFilters(f=>({...f,category:e.target.value}))} className="border p-2" />
        <input type="date" value={filters.from} onChange={(e)=>setFilters(f=>({...f,from:e.target.value}))} className="border p-2" />
        <input type="date" value={filters.to} onChange={(e)=>setFilters(f=>({...f,to:e.target.value}))} className="border p-2" />
        <button onClick={() => fetchPage(1)} className="px-3 py-2 bg-blue-600 text-white rounded">Filter</button>
      </div>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Category</th>
              <th className="p-2">Description</th>
              <th className="p-2 text-right">Debit</th>
              <th className="p-2 text-right">Credit</th>
              <th className="p-2">User</th>
              <th className="p-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {runningBalance().map(tx => (
              <tr key={tx._id} className="border-t">
                <td className="p-2">{new Date(tx.date).toLocaleString()}</td>
                <td className="p-2">{tx.category}</td>
                <td className="p-2">{tx.description}</td>
                <td className="p-2 text-right">{tx.type === 'expense' ? tx.amount.toFixed(2) : ''}</td>
                <td className="p-2 text-right">{tx.type === 'income' ? tx.amount.toFixed(2) : ''}</td>
                <td className="p-2">{typeof tx.registeredBy === 'string' ? tx.registeredBy : tx.registeredBy?.name}</td>
                <td className="p-2 text-right">{(tx as any).balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div>Total: {total}</div>
        <div>
          <button disabled={page<=1} onClick={()=>{const v=Math.max(1,page-1); setPage(v); fetchPage(v);}} className="px-2 py-1 border rounded mr-2">Prev</button>
          <button disabled={page>=Math.ceil(total/limit)} onClick={()=>{const v=page+1; setPage(v); fetchPage(v);}} className="px-2 py-1 border rounded">Next</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
