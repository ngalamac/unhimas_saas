import React, { useEffect, useState } from 'react';
import fetchClient from '../../../lib/fetchClient';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import { payTuition } from '../../../api/students';
import { useNavigation } from '../../../context/NavigationContext';
import { createTuitionPlan } from '../../../api/tuition';
import InstallmentsEditor from '../../accounting/InstallmentsEditor';

const TuitionStatusPage: React.FC = () => {
  const { currentBranch } = useBranch();
  const { showToast } = useUI();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterTuitionStatus] = useState('');

  const fetchStudents = async () => {
  try {
  setError(null);
  setLoading(true);
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filterProgram && { program: filterProgram }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(filterLevel && { level: filterLevel }),
        ...(filterTuitionStatus && { tuitionStatus: filterTuitionStatus }),
    ...(currentBranch && { branch: (currentBranch as any)._id || (currentBranch as any).id })
      });
      const url = `/api/students?${params.toString()}`;
      try { console.debug('[TuitionStatusPage] fetching', url); } catch (e) {}
      const res = await fetchClient.get(url);
      if (!res.ok) {
        await handleFetchError(res);
      }
      const data = await res.json();
  setStudents(data.data || []);
    } catch (e: any) {
      console.error('[TuitionStatusPage] fetch error', e);
      setError(e?.message || 'Failed to load students');
      showToast(e?.message || 'Failed to load students', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [tuitionDetails, setTuitionDetails] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  useNavigation();
  const [showCreate, setShowCreate] = useState(false);

  const loadTuition = async (studentId: string) => {
    try {
      const res = await fetchClient.get(`/api/students/${studentId}/tuition`);
      if (!res.ok) throw new Error('Failed to load tuition');
      const body = await res.json();
      return body;
    } catch (e) {
      console.error('loadTuition error', e);
      return null;
    }
  };

  const openDetails = async (s: any) => {
    setSelectedStudent(s);
    const details = await loadTuition(s._id);
    setTuitionDetails(details);
    setShowDetails(true);
  };

  const openPayment = async (s: any) => {
    setSelectedStudent(s);
    const details = await loadTuition(s._id);
    setTuitionDetails(details);
    setShowPayment(true);
  };

  async function handleRecordPayment(studentId: string, amount: number, installmentKey?: string) {
    try {
      await payTuition(studentId, { amount, installmentKey });
      // payTuition throws on non-ok, but ensure we refresh students
      showToast('Payment recorded', 'success');
      setShowPayment(false);
      fetchStudents();
    } catch (err: any) {
      console.error('Payment failed', err);
      showToast(err?.message || 'Payment failed', 'error');
    }
  }

  useEffect(() => { fetchStudents(); }, [currentBranch, search, filterProgram, filterDepartment, filterLevel, filterTuitionStatus]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tuition Status</h1>
          <p className="text-sm text-gray-500">Overview of tuition payments and statuses</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="border p-2" />
          <input value={filterProgram} onChange={e => setFilterProgram(e.target.value)} placeholder="Program" className="border p-2" />
          <input value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} placeholder="Department" className="border p-2" />
          <input value={filterLevel} onChange={e => setFilterLevel(e.target.value)} placeholder="Level" className="border p-2" />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="px-3 py-1 bg-indigo-600 text-white rounded">Create Tuition Plan</button>
      </div>

  <div className="bg-white rounded shadow overflow-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading students…</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No students found for the selected branch/filters.
            <div className="text-sm mt-2">Try removing filters or ensure a branch is selected.</div>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Student</th>
                <th className="p-2 text-left">Program</th>
                <th className="p-2 text-left">Tuition Status</th>
                <th className="p-2 text-left">Installments</th>
                <th className="p-2 text-left">Total Paid</th>
                <th className="p-2 text-left">Balance</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const installments = (s.tuitionInstallments || []);
                const overdueCount = installments.filter((it: any) => it.status === 'Overdue').length;
                return (
                <tr key={s._id} className="border-t">
                  <td className="p-2">{s.names} <div className="text-xs text-gray-500">ID: {s.studentId}</div></td>
                  <td className="p-2">{s.program?.name}</td>
                  <td className="p-2">{s.tuitionStatus} {overdueCount > 0 && <span className="ml-2 inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">{overdueCount} overdue</span>}</td>
                  <td className="p-2">{installments.length}</td>
                  <td className="p-2">{s.totalPaid || 0}</td>
                  <td className="p-2">{s.balanceDue || 0}</td>
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openDetails(s)} className="px-2 py-1 bg-gray-100 rounded text-sm">View</button>
                      <button onClick={() => openPayment(s)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Record Payment</button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
      
  <DetailsModal open={showDetails} onClose={() => setShowDetails(false)} details={tuitionDetails} />
  <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} details={tuitionDetails} onSubmit={(amount, installmentKey) => selectedStudent && handleRecordPayment(selectedStudent._id, amount, installmentKey)} />
  <TuitionPlanModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchStudents(); }} />
    </div>
  );
};

export default TuitionStatusPage;

// Tuition Plan creation modal
function TuitionPlanModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [rows, setRows] = useState<any[]>([{ key: `i_${Date.now()}`, label: 'Installment 1', amount: '', dueDate: '' }]);
  const { showToast } = useUI();

  if (!open) return null;

  const doCreate = async () => {
    if (!name || rows.length === 0) { showToast('Provide name and at least one installment', 'error'); return; }
    const installments = rows.map(r => ({ key: r.key || `i_${Date.now()}`, label: r.label, amount: Number(r.amount || 0), dueDate: r.dueDate || undefined }));
    try {
      await createTuitionPlan({ name, academicYear, installments });
      showToast('Tuition plan created', 'success');
      onCreated && onCreated();
    } catch (e: any) {
      console.error('create tuition plan', e);
      showToast(e?.message || 'Failed to create tuition plan', 'error');
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

// Details modal component
function DetailsModal({ open, onClose, details }: { open: boolean; onClose: () => void; details: any }) {
  if (!open || !details) return null;
  const student = details.student;
  const plan = details.plan;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white w-11/12 md:w-3/4 lg:w-1/2 p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tuition Details for {student.names}</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>
        <div className="space-y-3">
          <div><strong>Plan:</strong> {plan ? plan.name : '—'}</div>
          <div><strong>Total Paid:</strong> {student.totalPaid || 0}</div>
          <div><strong>Balance:</strong> {student.balanceDue || 0}</div>
          <div>
            <h4 className="font-medium">Installments</h4>
            <table className="w-full text-sm border mt-2">
              <thead className="bg-gray-100"><tr><th className="p-2 text-left">Label</th><th className="p-2">Amount</th><th className="p-2">Paid</th><th className="p-2">Status</th><th className="p-2">Due</th></tr></thead>
              <tbody>
                {(student.tuitionInstallments || []).map((it: any) => (
                  <tr key={it.key} className="border-t"><td className="p-2">{it.label}</td><td className="p-2">{it.amountDue}</td><td className="p-2">{it.paid || 0}</td><td className="p-2">{it.status}</td><td className="p-2">{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Payment modal
function PaymentModal({ open, onClose, details, onSubmit }: { open: boolean; onClose: () => void; details: any; onSubmit: (amount: number, installmentKey?: string) => void }) {
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState<string | undefined>(undefined);
  if (!open || !details) return null;
  const student = details.student;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white w-11/12 md:w-1/2 p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Record Payment for {student.names}</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} className="border p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm">Apply to installment (optional)</label>
            <select value={selected} onChange={e => setSelected(e.target.value || undefined)} className="border p-2 w-full">
              <option value="">-- Apply to earliest unpaid --</option>
              {(student.tuitionInstallments || []).map((it: any) => (
                <option key={it.key} value={it.key}>{it.label} — due: {it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '—'} — remaining: {(it.amountDue || 0) - (it.paid || 0)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={() => { const n = Number(amount || 0); if (!n || n <= 0) return; onSubmit(n, selected); }} className="px-3 py-1 bg-green-600 text-white rounded">Record</button>
          </div>
        </div>
      </div>
    </div>
  );
}
