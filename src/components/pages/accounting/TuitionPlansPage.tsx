import React, { useEffect, useState, useRef } from 'react';
import { getTuitionPlans, createTuitionPlan, updateTuitionPlan, deleteTuitionPlan } from '../../../api/tuition';
import { useUI } from '../../../context/UIContext';
import InstallmentsEditor from '../../accounting/InstallmentsEditor';

const TuitionPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingYear, setEditingYear] = useState('');
  const [editingInstallments, setEditingInstallments] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const evtRef = useRef<EventSource | null>(null);
  const { showToast } = useUI();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTuitionPlans();
      setPlans(data || []);
    } catch (e: any) {
      console.error('load tuition plans', e);
      showToast('Failed to load tuition plans', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    try {
      const es = new EventSource('/api/events');
      evtRef.current = es;
      es.addEventListener('tuition.plan.created', () => load());
      es.addEventListener('tuition.plan.updated', () => load());
      es.addEventListener('tuition.plan.deleted', () => load());
    } catch (e) {}
    return () => { try { evtRef.current && evtRef.current.close(); } catch (e) {} };
  }, []);

  const startEdit = (p: any) => {
    setEditingId(p._id);
    setEditingName(p.name || '');
    setEditingYear(p.academicYear || '');
    setEditingInstallments((p.installments || []).map((it: any) => ({ key: it.key || `i_${Date.now()}`, label: it.label, amount: it.amount || 0, dueDate: it.dueDate })));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateTuitionPlan(editingId, { name: editingName, academicYear: editingYear, installments: editingInstallments });
      setEditingId(null);
      load();
      showToast('Tuition plan updated', 'success');
    } catch (e: any) {
      console.error('update', e);
      showToast(e?.message || 'Failed to update', 'error');
    }
  };

  const doDelete = async (id: string) => {
    if (!confirm('Delete tuition plan?')) return;
    try {
      await deleteTuitionPlan(id);
      load();
      showToast('Tuition plan deleted', 'success');
    } catch (e: any) {
      console.error('delete', e);
      showToast(e?.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tuition Plans</h1>
          <p className="text-sm text-gray-500">Create and manage tuition plans</p>
        </div>
        <div>
          <button onClick={() => setShowCreate(true)} className="px-3 py-1 bg-indigo-600 text-white rounded">Create</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? <div>Loading…</div> : (
          <table className="min-w-full">
            <thead className="bg-gray-50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Year</th><th className="p-2 text-left">Installments</th><th className="p-2 text-left">Actions</th></tr></thead>
            <tbody>
              {plans.map(p => (
                <tr key={p._id} className="border-t">
                  <td className="p-2">{editingId === p._id ? <input value={editingName} onChange={e => setEditingName(e.target.value)} className="border p-1" /> : p.name}</td>
                  <td className="p-2">{editingId === p._id ? <input value={editingYear} onChange={e => setEditingYear(e.target.value)} className="border p-1" /> : p.academicYear}</td>
                  <td className="p-2">{(p.installments || []).length}</td>
                  <td className="p-2">
                    {editingId === p._id ? (
                      <div className="flex space-x-2"><button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded">Save</button><button onClick={() => setEditingId(null)} className="px-2 py-1 border rounded">Cancel</button></div>
                    ) : (
                      <div className="flex space-x-2"><button onClick={() => startEdit(p)} className="px-2 py-1 border rounded">Edit</button><button onClick={() => doDelete(p._id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

  {showCreate && <TuitionPlanCreate onClose={() => { setShowCreate(false); load(); }} />}
    </div>
  );
};

export default TuitionPlansPage;

function TuitionPlanCreate({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [rows, setRows] = useState<any[]>([{ key: `i_${Date.now()}`, label: 'Installment 1', amount: '', dueDate: '' }]);
  const { showToast } = useUI();

  const addRow = () => setRows(r => [...r, { label: `Installment ${r.length + 1}`, amount: '', dueDate: '' }]);
  const updateRow = (idx: number, val: Partial<{ label: string; amount: string; dueDate: string }>) => setRows(r => r.map((row, i) => i === idx ? { ...row, ...val } : row));
  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));

  const doCreate = async () => {
  if (!name || rows.length === 0) { showToast('Provide name and at least one installment', 'error'); return; }
  const installments = rows.map(r => ({ key: r.key || `i_${Date.now()}`, label: r.label, amount: Number(r.amount || 0), dueDate: r.dueDate || undefined }));
    try {
      await createTuitionPlan({ name, academicYear, installments });
      showToast('Tuition plan created', 'success');
      onClose();
    } catch (e: any) {
      console.error('create tuition', e);
      showToast(e?.message || 'Failed to create', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white w-11/12 md:w-3/4 p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create Tuition Plan</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="border p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm">Academic Year</label>
            <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="border p-2 w-full" placeholder="e.g. 2025/2026" />
          </div>
          <div>
            <h4 className="font-medium">Installments</h4>
            <InstallmentsEditor rows={rows} onChange={setRows} />
          </div>
          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={doCreate} className="px-3 py-1 bg-indigo-600 text-white rounded">Create</button>
          </div>
        </div>
      </div>
    </div>
  );
}
