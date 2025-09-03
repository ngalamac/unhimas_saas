import React, { useState, useEffect } from 'react';

const TransactionForm: React.FC<{ onCreated?: ()=>void }> = ({ onCreated }) => {
  const [form, setForm] = useState({ type: 'income', category: '', amount: '', date: '', linkedStudent: '', linkedStaff: '', description: '' });
  const [cats, setCats] = useState<any[]>([]);

  useEffect(()=>{ fetch('/api/accounting/categories').then(r=>r.json()).then(setCats).catch(()=>{}); }, []);

  const submit = async () => {
    const payload: any = { ...form, amount: Number(form.amount) };
    const r = await fetch('/api/accounting', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-permissions': 'accounting' }, body: JSON.stringify(payload) });
    if (r.ok) { setForm({ type: 'income', category: '', amount: '', date: '', linkedStudent: '', linkedStaff: '', description: '' }); onCreated?.(); }
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h3 className="font-semibold mb-2">New Transaction</h3>
      <div className="grid grid-cols-3 gap-2">
        <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="border p-2">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="border p-2">
          <option value="">-- Category --</option>
          {cats.filter(c=>c.type===form.type).map(c=> <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <input value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="Amount" className="border p-2" />
        <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="border p-2" />
        <input value={form.linkedStudent} onChange={e=>setForm(f=>({...f,linkedStudent:e.target.value}))} placeholder="Student ID (optional)" className="border p-2" />
        <input value={form.linkedStaff} onChange={e=>setForm(f=>({...f,linkedStaff:e.target.value}))} placeholder="Staff ID (optional)" className="border p-2" />
        <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" className="border p-2 col-span-3" />
        <div className="col-span-3"><button onClick={submit} className="px-3 py-2 bg-green-600 text-white rounded">Create</button></div>
      </div>
    </div>
  );
};

export default TransactionForm;
