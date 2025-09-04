import React, { useState } from 'react';

export interface StaffMember {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

interface Props {
  staff: StaffMember[];
  setStaff: (s: StaffMember[]) => void;
  onClose?: () => void;
}

const StaffManager: React.FC<Props> = ({ staff, setStaff, onClose }) => {
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: '', role: '', email: '' });

  function startAdd() {
    setEditing(null);
    setForm({ name: '', role: '', email: '' });
  }

  function startEdit(s: StaffMember) {
    setEditing(s);
    setForm({ name: s.name, role: s.role || '', email: s.email || '' });
  }

  function save() {
    if (!form.name.trim()) return;
    if (editing) {
      setStaff(staff.map(s => s.id === editing.id ? { ...editing, name: form.name, role: form.role, email: form.email } : s));
    } else {
      const id = `s_${Date.now()}`;
      setStaff([{ id, name: form.name, role: form.role, email: form.email }, ...staff]);
    }
    setEditing(null);
    setForm({ name: '', role: '', email: '' });
  }

  function remove(id: string) {
    if (!confirm('Delete staff member?')) return;
    setStaff(staff.filter(s => s.id !== id));
  }

  return (
    <div className="bg-white rounded shadow p-4 w-full max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Manage Staff</h3>
        <div className="flex items-center space-x-2">
          <button onClick={startAdd} className="px-2 py-1 border rounded text-sm">New</button>
          <button onClick={() => onClose && onClose()} className="px-2 py-1 border rounded text-sm">Close</button>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full border rounded p-2" />
        <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Role" className="w-full border rounded p-2" />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border rounded p-2" />
        <div className="flex justify-end">
          <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
        </div>
      </div>

      <div className="border-t pt-2">
        {staff.length === 0 ? <div className="text-sm text-gray-500">No staff yet</div> : (
          <ul className="space-y-2">
            {staff.map(s => (
              <li key={s.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.role} • {s.email}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => startEdit(s)} className="px-2 py-1 border rounded text-sm">Edit</button>
                  <button onClick={() => remove(s.id)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StaffManager;
