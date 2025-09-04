import React, { useEffect, useState } from 'react';
import fetchClient from '../../../lib/fetchClient';

const CategoriesPage: React.FC = () => {
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', type: 'income' });

  const load = async () => {
    const r = await fetchClient.get('/api/accounting/categories');
    if (!r.ok) return;
    setCats(await r.json());
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const r = await fetchClient.postJson('/api/accounting/categories', form);
    if (r.ok) { setForm({ name: '', type: 'income' }); load(); }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Categories</h1>
      <div className="mb-4 flex space-x-2">
        <input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} placeholder="Name" className="border p-2" />
        <select value={form.type} onChange={(e)=>setForm(f=>({...f,type:e.target.value}))} className="border p-2">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button onClick={submit} className="px-3 py-2 bg-green-600 text-white rounded">Add</button>
      </div>
      <div className="border rounded p-2">
        {cats.map(c => <div key={c._id} className="py-1 border-b last:border-b-0">{c.name} • {c.type}</div>)}
      </div>
    </div>
  );
};

export default CategoriesPage;
