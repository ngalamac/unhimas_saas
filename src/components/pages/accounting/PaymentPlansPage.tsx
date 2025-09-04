import React, { useEffect, useState } from 'react';
import fetchClient from '../../../lib/fetchClient';

const PaymentPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchClient.get('/api/payment-plans');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      console.error('load payment plans', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createPlan = async () => {
    try {
      const res = await fetchClient.postJson('/api/payment-plans', { name, targetAmount: Number(targetAmount), description });
      if (!res.ok) {
        const txt = await res.clone().text().catch(() => '');
        throw new Error(txt || `Failed (${res.status})`);
      }
      setName(''); setTargetAmount(''); setDescription('');
      load();
    } catch (e) {
      console.error('create plan', e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Plans</h1>
          <p className="text-sm text-gray-500">Create and manage reusable payment plans</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="grid grid-cols-3 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Plan name" className="border p-2" />
          <input value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="Target amount" className="border p-2" />
          <button onClick={createPlan} className="bg-orange-500 text-white px-3 rounded">Create</button>
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full mt-3 border p-2" />
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? <div>Loading…</div> : (
          <table className="min-w-full">
            <thead className="bg-gray-50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Description</th></tr></thead>
            <tbody>
              {plans.map(p => (
                <tr key={p._id} className="border-t"><td className="p-2">{p.name}</td><td className="p-2">{p.targetAmount}</td><td className="p-2">{p.description}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentPlansPage;
