import React from 'react';

export type InstallmentRow = { key?: string; label: string; amount: number | string; dueDate?: string };

export default function InstallmentsEditor({
  rows,
  onChange,
  allowRemove = true
}: {
  rows: InstallmentRow[];
  onChange: (rows: InstallmentRow[]) => void;
  allowRemove?: boolean;
}) {
  const updateRow = (idx: number, val: Partial<InstallmentRow>) => {
    const next = rows.map((r, i) => i === idx ? { ...r, ...val } : r);
    onChange(next);
  };
  const addRow = () => onChange([...rows, { key: `i_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, label: `Installment ${rows.length + 1}`, amount: '', dueDate: '' }]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.key || i} className="grid grid-cols-12 gap-2 items-center">
            <input value={r.label} onChange={e => updateRow(i, { label: e.target.value })} className="col-span-4 border p-2" />
            <input value={String(r.amount || '')} onChange={e => updateRow(i, { amount: e.target.value })} className="col-span-3 border p-2" placeholder="Amount" />
            <input type="date" value={r.dueDate || ''} onChange={e => updateRow(i, { dueDate: e.target.value })} className="col-span-4 border p-2" />
            {allowRemove && <button onClick={() => removeRow(i)} className="col-span-1 px-2 py-1 bg-red-600 text-white rounded">Del</button>}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button onClick={addRow} className="px-3 py-1 border rounded">Add installment</button>
        <div className="text-sm text-gray-600">Total: <strong>{total}</strong></div>
      </div>
    </div>
  );
}
