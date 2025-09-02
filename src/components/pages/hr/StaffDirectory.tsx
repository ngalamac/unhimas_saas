import React, { useEffect, useState } from 'react';

interface StaffMember {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

const StaffDirectory: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: '', role: '', email: '' });

  useEffect(() => { fetchStaff(); }, []);

  async function fetchStaff() {
    try {
      setLoading(true);
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to load staff');
      const json = await res.json();
      const list = Array.isArray(json.data || json) ? (json.data || json) : [];
      setStaff(list.map((s: any) => ({ id: s._id || s.id || String(s.id), name: s.name, role: s.role, email: s.email })));
    } catch (err: any) {
      console.warn(err);
      setError(err.message || 'Failed');
    } finally { setLoading(false); }
  }

  async function save() {
    try {
      if (!form.name.trim()) { setError('Name required'); return; }
      const payload = { name: form.name, role: form.role, email: form.email };
      if (editing) {
        const res = await fetch(`/api/staff/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Update failed');
      } else {
        const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Create failed');
      }
      setForm({ name: '', role: '', email: '' });
      setEditing(null);
      setShowAdd(false);
      await fetchStaff();
    } catch (err: any) { setError(err.message || 'Save failed'); }
  }

  async function remove(id: string) {
    if (!confirm('Delete staff member?')) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchStaff();
    } catch (err: any) { setError(err.message || 'Delete failed'); }
  }

  const filtered = staff.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || (s.role || '').toLowerCase().includes(query.toLowerCase()) || (s.email || '').toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Staff Directory</h2>
          <p className="text-sm text-gray-500">Create and manage staff records.</p>
        </div>
        <div className="flex items-center space-x-2">
          <input placeholder="Search staff" value={query} onChange={e => setQuery(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <button onClick={() => { setShowAdd(true); setEditing(null); setForm({ name: '', role: '', email: '' }); }} className="px-3 py-1 bg-blue-600 text-white rounded">New Staff</button>
        </div>
      </div>

      {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded">{error}</div>}

      <div className="bg-white border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="p-4">Loading…</td></tr> : (
              filtered.length === 0 ? <tr><td colSpan={4} className="p-4 text-gray-500">No staff found</td></tr> : (
                filtered.map(s => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.role || '—'}</td>
                    <td className="p-2">{s.email || '—'}</td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <button onClick={() => { setEditing(s); setForm({ name: s.name, role: s.role || '', email: s.email || '' }); setShowAdd(true); }} className="px-2 py-1 border rounded text-sm">Edit</button>
                        <button onClick={() => remove(s.id)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded w-full max-w-md p-4">
            <h3 className="font-semibold mb-2">{editing ? 'Edit Staff' : 'New Staff'}</h3>
            <div className="space-y-2">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full border rounded p-2" />
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Role" className="w-full border rounded p-2" />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border rounded p-2" />
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={() => setShowAdd(false)} className="px-3 py-1 border rounded">Cancel</button>
                <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;
