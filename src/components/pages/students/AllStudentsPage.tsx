import React, { useState, useEffect } from 'react';
import fetchClient from '../../../lib/fetchClient';
import { Search, Filter, Eye, Edit, Trash2, Download, Plus, Users, UserPlus, Mail, Phone, CreditCard, Award } from 'lucide-react';
import { getStudents, deleteStudent } from '../../../api/students';
import { getBranches } from '../../../api/branches';
import { useBranch } from '../../../context/BranchContext';
import { Student } from '../../../types/school';
import { useNavigation } from '../../../context/NavigationContext';
import useSSE from '../../../lib/useSSE';
import { useUI } from '../../../context/UIContext';
import { getStudentGpa, downloadTranscript } from '../../../api/grades';
import { GpaData } from '../../../types/grades';
import fetchClient from '../../../lib/fetchClient';

export const AllStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student> | null>(null);
  const [actionModal, setActionModal] = useState<any>({ open: false });
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [gpaData, setGpaData] = useState<GpaData | null>(null);
  const [emailModal, setEmailModal] = useState<{ open: boolean; recipients: string[]; subject: string; body: string; loading?: boolean; templateSelected?: boolean }>({ open: false, recipients: [], subject: '', body: '', templateSelected: false });
  const [emailContextStudent, setEmailContextStudent] = useState<Student | null>(null);
  const [smsModal, setSmsModal] = useState<{ open: boolean; recipients: string[]; body: string; loading?: boolean }>({ open: false, recipients: [], body: '' });
  const [pendingDeletes, setPendingDeletes] = useState<Record<string, { timer: number; student: Student }>>({});
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; studentIds: string[] }>>([]);
   const [aggregates, setAggregates] = useState<{ paid:number; partial:number; unpaid:number } | null>(null);
  const [branchMap, setBranchMap] = useState<Record<string,string>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<{ program?: string; department?: string; specialty?: string; status?: string; branch?: string; level?: string; session?: string; gender?: string }>({});

  // Pagination state (declare before effects that use them)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredStudents = students.filter(student => {
    const fn = (student.firstName || '').toLowerCase();
    const ln = (student.lastName || '').toLowerCase();
    const em = (student.email || '').toLowerCase();
    const sid = (student.studentId || '').toLowerCase();
    const matchesSearch = fn.includes(searchTerm.toLowerCase()) || ln.includes(searchTerm.toLowerCase()) || em.includes(searchTerm.toLowerCase()) || sid.includes(searchTerm.toLowerCase());
    const matchesProgram = !filterProgram || (typeof student.program === 'string' ? student.program === filterProgram : (student.program?.type === filterProgram));
    const matchesStatus = !filterStatus || (student.tuitionStatus || '') === filterStatus;

    return matchesSearch && matchesProgram && matchesStatus;
  });

  const { currentBranch } = useBranch();

  const getStudentId = (s: Student | any) => {
    return (s && ((s.id as any) || (s._id as any) || (s.studentId as any))) || '';
  };

  // helper to resolve profile picture URLs that may be returned as relative paths by the backend
  const resolveProfileUrl = (url?: string) => {
    if (!url) return '';
    // If absolute, check if it points to the frontend or the wrong host and remap to backend
  const envAny = (import.meta as any)?.env || {};
  const devBackend = envAny?.VITE_API_BASE_URL || envAny?.VITE_BACKEND_URL || (envAny?.DEV ? 'http://localhost:5000' : '');
    const backendOrigin = devBackend || window.location.origin;
    if (/^https?:\/\//i.test(url)) {
      try {
        const parsed = new URL(url);
        // if the path looks like our uploads endpoint but host is not the backend, remap to backend origin
        if (parsed.pathname.startsWith('/api/uploads/file/') || parsed.pathname.startsWith('/uploads/')) {
          if (!url.startsWith(backendOrigin)) {
            return `${backendOrigin}${parsed.pathname}`;
          }
        }
        return url;
      } catch (e) {
        return url;
      }
    }
    // if it's a relative path, prefix with backend origin
    if (url.startsWith('/')) return `${backendOrigin}${url}`;
    return `${backendOrigin}/${url}`;
  };
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const branchId = currentBranch ? ((currentBranch as any)._id || (currentBranch as any).id) : undefined;
    getStudents(branchId, page, pageSize, { search: searchTerm, program: filterProgram, status: filterStatus })
      .then((res) => {
        if (!mounted) return;
        setStudents(Array.isArray(res.data) ? res.data : []);
        setTotal(Number(res.total) || 0);
        if (res.aggregates) setAggregates(res.aggregates);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load students');
        setStudents([]);
        setTotal(0);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [currentBranch, page, pageSize, searchTerm, filterProgram, filterStatus]);

  // Debug: log table column values for each student row whenever students list updates
  useEffect(() => {
    try {
      students.forEach((s, idx) => {
        const _s: any = s as any;
        const row = {
          idx,
          student: `${_s.firstName || ''} ${_s.lastName || ''}`,
          program: typeof _s.program === 'string' ? _s.program : (_s.program?.type || _s.program?.name || ''),
          department: typeof _s.department === 'string' ? _s.department : (_s.department?.name || ''),
          level: _s.level,
          session: _s.session,
          phone: _s.phoneNumber || _s.phone || '',
          branch: typeof _s.branch === 'string' ? _s.branch : (_s.branch?.name || _s.branch?._id || ''),
          tuitionStatus: _s.tuitionStatus,
          profilePicture: _s.profilePicture || ''
        };
        // eslint-disable-next-line no-console
        console.debug('[students-table-row]', row);
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error logging students table rows', e);
    }
  }, [students]);

  const refresh = () => {
  setLoading(true);
  setError(null);
  const branchId = currentBranch ? ((currentBranch as any)._id || (currentBranch as any).id) : undefined;
     getStudents(branchId, page, pageSize, { search: searchTerm, program: filterProgram, status: filterStatus })
      .then((res) => {
        setStudents(Array.isArray(res.data) ? res.data : []);
        setTotal(Number(res.total) || 0);
       if (res.aggregates) setAggregates(res.aggregates);
      })
      .catch((err) => setError(err?.message || 'Failed to load students'))
      .finally(() => setLoading(false));
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filteredStudents; // server returns only current page of students already
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const { setCurrentPage } = useNavigation();
  const [exportAllOpen, setExportAllOpen] = useState(false);
  const [exportSelectedOpen, setExportSelectedOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const triggerExport = async (format: 'csv' | 'xlsx' | 'pdf', ids?: string[]) => {
    const branchId = currentBranch ? ((currentBranch as any)._id || (currentBranch as any).id) : undefined;
    const body: any = { format };
    if (ids && ids.length > 0) body.ids = ids;
    if (branchId) body.branch = branchId;
    if (searchTerm) body.search = searchTerm;
    if (filterProgram) body.program = filterProgram;
    if (filterStatus) body.status = filterStatus;

    try {
      setExportLoading(true);
      // debug: log payload being sent so we can verify selected IDs
      // eslint-disable-next-line no-console
      console.debug('[students/export] client payload', body);
      // fetch as blob using Authorization-aware fetch client
      const res = await fetchClient.postJson('/api/students/export', body);
      // if server responded with non-blob JSON error, try to parse
  if (!res.ok) {
        let err = 'Export failed';
        try { const j = await res.json(); err = j?.message || err; } catch (e) {}
  setToasts(prev => [{ id: `export-err-${Date.now()}`, message: err, studentIds: [] }, ...prev]);
  try { setExportAllOpen(false); } catch (e) {}
  try { setExportSelectedOpen(false); } catch (e) {}
        return;
      }

  const blob = await res.blob();
      // derive filename from content-disposition or default
      const cd = res.headers.get('content-disposition') || '';
      let filename = `students-export.${format}`;
      try {
        // support both filename="..." and filename*=UTF-8''... formats
        const fnStarMatch = /filename\*=[^']+'[^']+'([^;\n]+)/i.exec(cd);
        if (fnStarMatch && fnStarMatch[1]) {
          filename = decodeURIComponent(fnStarMatch[1].trim().replace(/"/g, ''));
        } else {
          const fnMatch = /filename="?([^";]+)"?/i.exec(cd);
          if (fnMatch && fnMatch[1]) filename = fnMatch[1].trim();
        }
      } catch (e) {
        // ignore parse errors and keep default filename
      }

  const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToasts(prev => [{ id: `export-ok-${Date.now()}`, message: `Export (${format}) started`, studentIds: [] }, ...prev]);
      // close both dropdowns if open
      try { setExportAllOpen(false); } catch (e) {}
      try { setExportSelectedOpen(false); } catch (e) {}
    } catch (e: any) {
      setToasts(prev => [{ id: `export-err-${Date.now()}`, message: `Export failed: ${String(e?.message || e)}`, studentIds: [] }, ...prev]);
  try { setExportAllOpen(false); } catch (er) {}
  try { setExportSelectedOpen(false); } catch (er) {}
    }
    finally {
      setExportLoading(false);
    }
  };

  // Live polling to refresh the current view periodically (pauses on modal interactions / when not visible)
  useEffect(() => {
    let mounted = true;
    let timer: any = null;
    const shouldPause = () => {
      // pause if any modal is open or we have pending deletes
      return showEditModal || actionModal?.open || emailModal.open || smsModal.open || showDeleteModal || Object.keys(pendingDeletes || {}).length > 0 || exportAllOpen || exportSelectedOpen;
    };

    const runPoll = async () => {
      if (!mounted) return;
      if (!liveEnabled) return;
      if (document.hidden) return; // don't poll when tab not visible
      if (shouldPause()) return;
      try {
        const branchId = currentBranch ? ((currentBranch as any)._id || (currentBranch as any).id) : undefined;
        const res: any = await getStudents(branchId, page, pageSize, { search: searchTerm, program: filterProgram, status: filterStatus });
        if (!mounted) return;
        if (Array.isArray(res.data)) {
          // shallow compare lengths and ids to avoid noisy updates
          const existingIds = students.map(s => getStudentId(s)).join(',');
          const incomingIds = res.data.map((s: any) => getStudentId(s)).join(',');
          if (existingIds !== incomingIds) {
            setStudents(Array.isArray(res.data) ? res.data : []);
          }
        }
        if (res.aggregates) setAggregates(res.aggregates);
      } catch (e) {
        // ignore polling errors; we'll try again later
        // eslint-disable-next-line no-console
        console.debug('[students/livePoll] poll error', (e as any)?.message || e);
      }
    };

    if (liveEnabled) {
      // initial kick
      runPoll();
      timer = setInterval(runPoll, 10000);
    }
    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [liveEnabled, currentBranch, page, pageSize, searchTerm, filterProgram, filterStatus, showEditModal, actionModal, emailModal, smsModal, showDeleteModal, pendingDeletes, exportAllOpen, exportSelectedOpen, students]);

  // SSE subscription for realtime updates (complements polling)
  const ui = (() => { try { return useUI(); } catch (e) { return null as any; } })();
  useSSE('/api/events', {
    'student.created': (_) => { ui && ui.showToast && ui.showToast('New student added'); refresh(); },
    'student.updated': (_) => { ui && ui.showToast && ui.showToast('Student updated'); refresh(); },
    'student.deleted': (_) => { ui && ui.showToast && ui.showToast('Student deleted'); refresh(); },
  });

  // Lazy load next page (append) when user requests
  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const branchId = currentBranch ? ((currentBranch as any)._id || (currentBranch as any).id) : undefined;
      const nextPage = Math.floor(students.length / pageSize) + 1;
      const res: any = await getStudents(branchId, nextPage, pageSize, { search: searchTerm, program: filterProgram, status: filterStatus });
      if (Array.isArray(res.data) && res.data.length) {
        setStudents(prev => [...prev, ...res.data]);
        setTotal(Number(res.total) || total);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[students/loadMore] error', e);
    } finally {
      setLoadingMore(false);
    }
  };

  // show a load more control if server has more pages than currently loaded
  const hasMore = students.length < total;

  // load branches for filter dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await getBranches();
        if (!mounted) return;
        if (Array.isArray(res)) {
          const map: Record<string,string> = {};
          res.forEach((b: any) => { map[(b._id || b.id || b)] = (b.name || b.title || String(b)); });
          setBranchMap(map);
        } else if (res && Array.isArray(res.data)) {
          const map: Record<string,string> = {};
          res.data.forEach((b: any) => { map[(b._id || b.id || b)] = (b.name || b.title || String(b)); });
          setBranchMap(map);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => getStudentId(s)).filter((id): id is string => Boolean(id)));
    }
  };

  const handleSelectStudent = (studentId?: string) => {
    if (!studentId) return;
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleDeleteStudent = (studentId?: string) => {
    if (!studentId) return;
    setStudentToDelete(studentId);
    setShowDeleteModal(true);
  };

  // Schedule deletion with undo window (5s). Actual API delete will occur after timeout.
  const scheduleDelete = (id: string, student: Student) => {
    // remove from visible list immediately
    setStudents(prev => prev.filter(s => s.id !== id));
    setSelectedStudents(prev => prev.filter(sid => sid !== id));

    const timer = window.setTimeout(async () => {
      try {
        await deleteStudent(id);
      } catch (e) {
        // if API delete fails, re-add the student to the list (best-effort)
        setStudents(prev => [student, ...prev]);
      } finally {
        setPendingDeletes(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        setToasts(prev => prev.filter(t => !t.studentIds.includes(id)));
      }
    }, 5000);

    setPendingDeletes(prev => ({ ...prev, [id]: { timer, student } }));
    // add a toast entry
    const toastId = `del-${Date.now()}-${id}`;
    setToasts(prev => [{ id: toastId, message: `Deleted ${student.firstName} ${student.lastName}`, studentIds: [id] }, ...prev]);
  };

  const cancelScheduledDelete = (id: string) => {
    const p = (pendingDeletes as any)[id];
    if (p) {
      clearTimeout(p.timer as any);
      setPendingDeletes(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      // restore student to list
      setStudents(prev => [p.student, ...prev]);
      // remove from toasts
      setToasts(prev => prev.map(t => ({ ...t, studentIds: t.studentIds.filter(sid => sid !== id) })).filter(t => t.studentIds.length > 0));
    }
  };

  const confirmDelete = () => {
    if (!studentToDelete) return;
    const student = students.find(s => s.id === studentToDelete) || (pendingDeletes[studentToDelete] && pendingDeletes[studentToDelete].student) || null;
    // if not found in current list, try to use previously captured student reference
    const toSchedule = student || (studentToDelete ? { id: studentToDelete } as Student : null);
    if (!toSchedule) {
      setShowDeleteModal(false);
      setStudentToDelete(null);
      return;
    }
    scheduleDelete(studentToDelete, toSchedule as Student);
    setShowDeleteModal(false);
    setStudentToDelete(null);
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    // initialize editable form state
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phoneNumber: student.phoneNumber,
      level: (student as any).level,
      session: student.session,
      tuitionStatus: student.tuitionStatus,
      // guardian is not part of Student type; keep as any on the editable form
      guardian: (student as any).guardian || undefined,
    } as any);
    setShowEditModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) return;
    const ids = [...selectedStudents];
    ids.forEach(id => {
      const student = students.find(s => s.id === id) || (pendingDeletes[id] && pendingDeletes[id].student);
      if (student) scheduleDelete(id, student);
      else {
        // schedule with minimal info
        scheduleDelete(id, { id } as Student);
      }
    });
    setSelectedStudents([]);
  };

  const handleSendEmail = (studentParam?: string | Student) => {
    let student: Student | undefined;
    if (!studentParam) return;
    if (typeof studentParam === 'string') {
      student = students.find(s => getStudentId(s) === studentParam);
    } else {
      student = studentParam as Student;
    }
    if (!student) return;
    setEmailContextStudent(student);
    setEmailModal({ open: true, recipients: student.email ? [student.email] : [], subject: ``, body: ``, loading: false, templateSelected: false });
  };

  const handleSendSMS = (studentParam?: string | Student) => {
    let student: Student | undefined;
    if (!studentParam) return;
    if (typeof studentParam === 'string') {
      student = students.find(s => getStudentId(s) === studentParam);
    } else {
      student = studentParam as Student;
    }
    if (!student) return;
    setSmsModal({ open: true, recipients: student.phoneNumber ? [student.phoneNumber] : [], body: `Hello ${student.firstName || ''}`, loading: false });
  };

  const handleViewPayments = (studentId?: string) => {
    if (!studentId) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    setActionModal({
      open: true,
      title: 'Payment History',
      content: `Open payment history for ${student.firstName} ${student.lastName}?`,
      confirmLabel: 'Open',
      onConfirm: () => {
        setActionModal({ open: false });
        try { localStorage.setItem('selectedStudentId', String(student.id || '')); } catch (e) {}
        setCurrentPage('payment-history');
      }
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Students</h1>
          <p className="text-gray-600">Manage and view all registered students</p>
        </div>
  <div className="flex space-x-3 relative items-center">
            <div className="relative">
              <button disabled={exportLoading} onClick={() => { setExportAllOpen(o => !o); }} className={`bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 ${exportLoading ? 'opacity-80 cursor-wait' : ''}`}>
                {exportLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle></svg>
                ) : <Download className="w-4 h-4" />}
                <span>{exportLoading ? 'Exporting...' : 'Export'}</span>
              </button>
              {exportAllOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
                  <button onClick={() => { setExportAllOpen(false); triggerExport('csv'); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">Download CSV</button>
                  <button onClick={() => { setExportAllOpen(false); triggerExport('xlsx'); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">Download Excel</button>
                  <button onClick={() => { setExportAllOpen(false); triggerExport('pdf'); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">Download PDF</button>
                </div>
              )}
          </div>
          <button onClick={() => setCurrentPage('student-registration')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
          <div className="flex items-center ml-2 space-x-2 text-sm">
            <label className="flex items-center space-x-2 text-gray-700">
              <input type="checkbox" checked={liveEnabled} onChange={(e) => setLiveEnabled(e.target.checked)} className="rounded" />
              <span>Live</span>
            </label>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fees Paid</p>
              <p className="text-xl font-bold text-gray-900">{aggregates ? aggregates.paid : students.filter(s => s.tuitionStatus === 'Paid').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Partial Payment</p>
              <p className="text-xl font-bold text-gray-900">{aggregates ? aggregates.partial : students.filter(s => s.tuitionStatus === 'Partial').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unpaid</p>
              <p className="text-xl font-bold text-gray-900">{aggregates ? aggregates.unpaid : students.filter(s => s.tuitionStatus === 'Unpaid').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            <option value="HND">HND</option>
            <option value="Bachelor">Bachelor</option>
            <option value="Masters">Masters</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <button onClick={() => { setTempFilters({ program: filterProgram || '', department: filterDepartment || '', specialty: filterSpecialty || '', status: filterStatus || '', branch: '', level: '', session: '', gender: '' }); setFiltersOpen(true); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedStudents.length > 0 && (
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">{selectedStudents.length} students selected</span>
            <button 
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Delete Selected
            </button>
            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                <span onClick={() => {
                  const recipients = selectedStudents.map(id => students.find(s => s.id === id)?.email).filter(Boolean) as string[];
                  setEmailContextStudent(null);
                  setEmailModal({ open: true, recipients, subject: ``, body: ``, loading: false, templateSelected: false });
                }}>Send Email</span>
            </button>
                <button className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700" onClick={() => {
              const recipients = selectedStudents.map(id => {
                const s = students.find(s => s.id === id);
                return s?.phoneNumber || (s as any)?.phone;
              }).filter(Boolean) as string[];
              if (recipients.length === 0) {
                setToasts(prev => [{ id: `sms-empty-${Date.now()}`, message: 'No phone numbers selected', studentIds: [] }, ...prev]);
                return;
              }
              setSmsModal({ open: true, recipients, body: 'Hello', loading: false });
            }}>
              Send SMS
            </button>
            <div className="relative">
              <button onClick={() => setExportSelectedOpen(o => !o)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">Export Selected</button>
              {exportSelectedOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
                  <button onClick={() => { setExportSelectedOpen(false); triggerExport('csv', selectedStudents); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">Download CSV</button>
                  <button onClick={() => { setExportSelectedOpen(false); triggerExport('xlsx', selectedStudents); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">Download Excel</button>
                  <button onClick={() => { setExportSelectedOpen(false); triggerExport('pdf', selectedStudents); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">Download PDF</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">Loading students...</div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-between">
          <div>{error}</div>
          <div>
            <button onClick={refresh} className="ml-4 px-3 py-1 bg-red-600 text-white rounded">Retry</button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuition Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((student, i) => (
                <tr key={(student as any)._id || student.id || student.studentId || i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                      <input
                      type="checkbox"
                      checked={Boolean(getStudentId(student)) && selectedStudents.includes(getStudentId(student) as string)}
                      onChange={() => handleSelectStudent(getStudentId(student))}
                      disabled={!getStudentId(student)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        { (student as any).profilePicture ? (
                          // show profile picture (object-cover to keep square)
                          <img loading="lazy" src={resolveProfileUrl((student as any).profilePicture as string)} alt={`${student.firstName || ''} ${student.lastName || ''}`} className="w-10 h-10 object-cover rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">{(student.firstName?.[0] || '')}{(student.lastName?.[0] || '')}</span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName || ''} {student.lastName || ''}
                        </div>
                        <div className="text-sm text-gray-500">{student.email || ''}</div>
                        <div className="text-xs text-gray-400">{student.studentId || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{typeof student.program === 'string' ? student.program : (student.program?.type || student.program?.name || '')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{typeof student.department === 'string' ? student.department : (student.department?.name || '')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{typeof (student as any).specialty === 'string' ? (student as any).specialty : (((student as any).specialty?.name) || '')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Level {student.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.session}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    { (student.phoneNumber || (student as any).phone || '') }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    { typeof (student as any).branch === 'string' ? (branchMap[(student as any).branch] || (student as any).branch) : ((student as any).branch?.name || (student as any).branch?._id || '') }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.tuitionStatus)}`}>
                      {student.tuitionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                            setViewStudent(student);
                            getStudentGpa(getStudentId(student)).then(setGpaData).catch(() => setGpaData(null));
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditStudent(student)}
                        className="text-green-600 hover:text-green-900" 
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendEmail(student)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Send Email"
                        disabled={!getStudentId(student)}
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendSMS(student)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Send SMS"
                        disabled={!getStudentId(student)}
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewPayments(getStudentId(student))}
                        className="text-indigo-600 hover:text-indigo-900" 
                        title="View Payments"
                        disabled={!getStudentId(student)}
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(getStudentId(student))}
                        className="text-red-600 hover:text-red-900" 
                        title="Delete Student"
                        disabled={!getStudentId(student)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {paginated.length} of {filteredStudents.length} students (total {students.length})
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Previous</button>
          <div className="px-3 py-1 border border-gray-300 rounded text-sm bg-white">{page} / {totalPages}</div>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Next</button>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border border-gray-300 rounded">
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
          </select>
            {hasMore && (
              <button onClick={loadMore} disabled={loadingMore} className="px-3 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50">
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this student? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generic Action Modal (Send Email / SMS / Open Payments) */}
      {actionModal?.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{actionModal.title}</h3>
              <p className="text-gray-600 mb-6">{actionModal.content}</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setActionModal({ open: false })}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { try { actionModal.onConfirm && actionModal.onConfirm(); } catch (e) { console.error(e); } }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {actionModal.confirmLabel || 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {viewStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{viewStudent.firstName} {viewStudent.lastName}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                  { (viewStudent as any).profilePicture ? (
                    <img loading="lazy" src={resolveProfileUrl((viewStudent as any).profilePicture)} alt="profile" className="w-20 h-20 object-cover" />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center text-xl font-bold text-gray-700">{(viewStudent.firstName?.[0]||'')}{(viewStudent.lastName?.[0]||'')}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-700">Email: {viewStudent.email || '—'}</div>
                  <div className="text-sm text-gray-700">Phone: {viewStudent.phoneNumber || (viewStudent as any).phone || '—'}</div>
                  <div className="text-sm text-gray-700">Program: {typeof viewStudent.program === 'string' ? viewStudent.program : (viewStudent.program?.type || '')}</div>
                  <div className="text-sm text-gray-700">Branch: {typeof (viewStudent as any).branch === 'string' ? (branchMap[(viewStudent as any).branch] || (viewStudent as any).branch) : ((viewStudent as any).branch?.name || '')}</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold">Guardian</h4>
                <div className="text-sm text-gray-700">{(viewStudent as any).guardian?.name || '—'}</div>
                <div className="text-sm text-gray-700">{(viewStudent as any).guardian?.contact || '—'}</div>
                <div className="text-sm text-gray-700">{(viewStudent as any).guardian?.address || '—'}</div>
              </div>
              <div>
                  <h4 className="text-sm font-semibold">Academic Info</h4>
                  {gpaData ? (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700">Overall GPA: {gpaData.gpa.toFixed(2)}</div>
                        <SemesterGpa studentId={getStudentId(viewStudent)} />
                      </div>
                  ) : (
                      <div className="text-sm text-gray-500">Loading GPA...</div>
                  )}
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-2">
              <button onClick={async () => {
                  try {
                      const blob = await downloadTranscript(getStudentId(viewStudent));
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `transcript-${viewStudent.studentId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                  } catch (err) {
                      alert('Failed to download transcript');
                  }
              }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Transcript</span>
              </button>
              <button onClick={() => { setViewStudent(null); setGpaData(null); }} className="px-4 py-2 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Semester GPA Inline Component */}
      {/* Keep definition at file end to avoid re-renders */}

      {/* Email Composer Modal */}
      {emailModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Send Email</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm">To</label>
                <input disabled={emailModal.loading} type="text" value={emailModal.recipients.join(', ')} readOnly className="w-full px-3 py-2 border rounded" />
              </div>
              {/* Template suggestions */}
              <div>
                <label className="text-sm font-medium">Choose template</label>
                <div className="mt-2 flex space-x-2">
                  <button onClick={() => {
                    // Announcement sample
                    const s = emailContextStudent;
                    const subject = s ? `Announcement: Important update for ${s.firstName} ${s.lastName}` : 'Announcement';
                    const body = s ? `Hello ${s.firstName} ${s.lastName},\n\nWe have an important announcement regarding campus activities. Please check the portal for details.\n\nRegards,\nUNHIMAS` : `Hello,\n\nWe have an important announcement regarding campus activities. Please check the portal for details.\n\nRegards,\nUNHIMAS`;
                    setEmailModal(m => ({ ...m, subject, body, templateSelected: true }));
                  }} className="px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100">Announcement</button>
                  <button onClick={() => {
                    // Tuition reminder sample
                    const s = emailContextStudent;
                    const subject = s ? `Tuition Reminder for ${s.firstName} ${s.lastName}` : 'Tuition Reminder';
                    const amount = (emailContextStudent as any)?.tuitionAmount || 'your outstanding balance';
                    const body = s ? `Hello ${s.firstName} ${s.lastName},\n\nThis is a friendly reminder that your tuition balance of ${amount} is due. Please make payment before the deadline to avoid penalties.\n\nRegards,\nFinance Office` : `Hello,\n\nThis is a friendly reminder that your tuition balance is due. Please make payment before the deadline to avoid penalties.\n\nRegards,\nFinance Office`;
                    setEmailModal(m => ({ ...m, subject, body, templateSelected: true }));
                  }} className="px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100">Tuition Reminder</button>
                  <button onClick={() => {
                    // Custom: leave empty but prefill greeting
                    const s = emailContextStudent;
                    const subject = s ? `Message for ${s.firstName} ${s.lastName}` : '';
                    const body = s ? `Hello ${s.firstName} ${s.lastName},\n\n` : `Hello,\n\n`;
                    setEmailModal(m => ({ ...m, subject, body, templateSelected: true }));
                  }} className="px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100">Custom</button>
                </div>
              </div>
              <div>
                <label className="text-sm">Subject</label>
                <input disabled={emailModal.loading} type="text" value={emailModal.subject} onChange={(e) => setEmailModal(m => ({ ...m, subject: e.target.value }))} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="text-sm">Message</label>
                <textarea disabled={emailModal.loading} value={emailModal.body} onChange={(e) => setEmailModal(m => ({ ...m, body: e.target.value }))} className="w-full px-3 py-2 border rounded h-32" />
              </div>
            </div>
              <div className="p-6 border-t flex justify-end space-x-3">
              <button disabled={emailModal.loading} onClick={() => { setEmailModal({ open: false, recipients: [], subject: '', body: '' }); setEmailContextStudent(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button disabled={emailModal.recipients.length === 0 || emailModal.loading} onClick={async () => {
                setEmailModal(m => ({ ...(m || {}), loading: true } as any));
                try {
                  const res = await fetchClient.postJson('/api/communication/email', { to: emailModal.recipients.join(','), subject: emailModal.subject, text: emailModal.body });
                  let data: any = {};
                  try { data = await res.json(); } catch (er) { data = {}; }
                  if (!res.ok) {
                    setToasts(prev => [{ id: `email-err-${Date.now()}`, message: data?.message || `Email send failed (${res.status})`, studentIds: [] }, ...prev]);
                    // keep modal open and allow retry
                    setEmailModal(m => ({ ...(m || {}), loading: false } as any));
                    return;
                  } else {
                    setToasts(prev => [{ id: `email-${Date.now()}`, message: data?.message || 'Email(s) queued', studentIds: emailModal.recipients.map(() => '') }, ...prev]);
                    // close modal on success
                    setEmailModal({ open: false, recipients: [], subject: '', body: '' });
                    setEmailContextStudent(null);
                    return;
                  }
                } catch (e: any) {
                  setToasts(prev => [{ id: `email-err-${Date.now()}`, message: `Failed to send email: ${String(e?.message || e)}`, studentIds: [] }, ...prev]);
                  setEmailModal(m => ({ ...(m || {}), loading: false } as any));
                  return;
                }
              }} className="px-4 py-2 bg-blue-600 text-white rounded">
                {emailModal.loading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    <span>Sending...</span>
                  </span>
                ) : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Composer Modal */}
      {smsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Send SMS</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm">To</label>
                <input disabled={smsModal.loading} type="text" value={smsModal.recipients.join(', ')} readOnly className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="text-sm">Message</label>
                <textarea disabled={smsModal.loading} value={smsModal.body} onChange={(e) => setSmsModal(m => ({ ...m, body: e.target.value }))} className="w-full px-3 py-2 border rounded h-28" />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button onClick={() => setSmsModal({ open: false, recipients: [], body: '' })} className="px-4 py-2 border rounded">Cancel</button>
              <button disabled={smsModal.recipients.length === 0 || smsModal.loading} onClick={async () => {
                setSmsModal(m => ({ ...(m || {}), loading: true } as any));
                try {
                  const res = await fetchClient.postJson('/api/communication/sms', { to: smsModal.recipients.join(','), text: smsModal.body });
                  let data: any = {};
                  try { data = await res.json(); } catch (er) { data = {}; }
                  if (!res.ok) {
                    setToasts(prev => [{ id: `sms-err-${Date.now()}`, message: data?.message || `SMS send failed (${res.status})`, studentIds: [] }, ...prev]);
                    setSmsModal(m => ({ ...(m || {}), loading: false } as any));
                    return;
                  } else {
                    setToasts(prev => [{ id: `sms-${Date.now()}`, message: data?.message || 'SMS queued', studentIds: smsModal.recipients.map(() => '') }, ...prev]);
                    setSmsModal({ open: false, recipients: [], body: '' });
                    return;
                  }
                } catch (e: any) {
                  setToasts(prev => [{ id: `sms-err-${Date.now()}`, message: `Failed to send SMS: ${String(e?.message || e)}`, studentIds: [] }, ...prev]);
                  setSmsModal(m => ({ ...(m || {}), loading: false } as any));
                  return;
                }
              }} className="px-4 py-2 bg-blue-600 text-white rounded">{smsModal.loading ? (
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                  <span>Sending...</span>
                </span>
              ) : 'Send'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toasters */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {toasts.map(t => (
          <div key={t.id} className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow flex items-center space-x-4">
            <div className="flex-1 text-sm">{t.message}</div>
            <div className="flex items-center space-x-2">
              <button onClick={() => { t.studentIds.forEach(id => cancelScheduledDelete(id)); }} className="px-3 py-1 bg-white text-gray-800 rounded">Undo</button>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="px-2 py-1 text-sm text-gray-300">Dismiss</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Student Modal */}
      {showEditModal && studentToEdit && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={String(editForm.firstName || '')}
                    onChange={(e) => setEditForm(f => ({ ...(f || {}), firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={String(editForm.lastName || '')}
                    onChange={(e) => setEditForm(f => ({ ...(f || {}), lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={String(editForm.email || '')}
                    onChange={(e) => setEditForm(f => ({ ...(f || {}), email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={String(editForm.phoneNumber || '')}
                    onChange={(e) => setEditForm(f => ({ ...(f || {}), phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={String(editForm.level || '')}
                    onChange={(e) => setEditForm(f => ({ ...(f || {}), level: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Status</label>
                  <select
                    value={String(editForm.tuitionStatus || '')}
                    onChange={(e) => setEditForm(f => ({ ...(f || {}), tuitionStatus: e.target.value as Student['tuitionStatus'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => { setShowEditModal(false); setStudentToEdit(null); setEditForm(null); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!studentToEdit || !editForm) return;
                  try {
                    const updated = await (await import('../../../api/students')).updateStudent(studentToEdit.id as string, editForm as any);
                    // replace in local list
                    setStudents(prev => prev.map(s => (s.id === (studentToEdit.id as string) ? (updated as Student) : s)));
                    setToasts(prev => [{ id: `upd-${Date.now()}`, message: 'Student updated', studentIds: [studentToEdit.id as string] }, ...prev]);
                    setShowEditModal(false);
                    setStudentToEdit(null);
                    setEditForm(null);
                  } catch (e: any) {
                    setToasts(prev => [{ id: `upd-err-${Date.now()}`, message: `Update failed: ${String(e?.message || e)}`, studentIds: [studentToEdit.id as string] }, ...prev]);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Filters Modal */}
      {filtersOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">More Filters</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm">Program</label>
                <select value={tempFilters.program || ''} onChange={(e) => setTempFilters(f => ({ ...(f||{}), program: e.target.value }))} className="w-full px-3 py-2 border rounded">
                  <option value="">Any</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Department</label>
                <select value={tempFilters.department || ''} onChange={(e) => setTempFilters(f => ({ ...(f||{}), department: e.target.value }))} className="w-full px-3 py-2 border rounded">
                  <option value="">Any</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Specialty</label>
                <select value={tempFilters.specialty || ''} onChange={(e) => setTempFilters(f => ({ ...(f||{}), specialty: e.target.value }))} className="w-full px-3 py-2 border rounded">
                  <option value="">Any</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Tuition Status</label>
                <select value={tempFilters.status || ''} onChange={(e) => setTempFilters(f => ({ ...(f||{}), status: e.target.value }))} className="w-full px-3 py-2 border rounded">
                  <option value="">Any</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Branch</label>
                <select value={tempFilters.branch || ''} onChange={(e) => setTempFilters(f => ({ ...(f||{}), branch: e.target.value }))} className="w-full px-3 py-2 border rounded">
                  <option value="">Any</option>
                  {Object.entries(branchMap).map(([id,name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Level</label>
                  <input value={tempFilters.level || ''} onChange={(e) => setTempFilters(f => ({ ...(f||{}), level: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm">Session</label>
                  <input value={tempFilters.session || ''} onChange={(e) => setTempFilters(f => ({ ...(f||{}), session: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="text-sm">Gender</label>
                <select value={tempFilters.gender || ''} onChange={(e) => setTempFilters(f => ({ ...(f||{}), gender: e.target.value }))} className="w-full px-3 py-2 border rounded">
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button disabled={false} onClick={() => { setFiltersOpen(false); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={() => {
                // apply temp filters to main filter state
                setFilterProgram(tempFilters.program || '');
                setFilterStatus(tempFilters.status || '');
                // for branch, we store in currentBranch? for now store in local branchMap filter using setBranchMap selection
                if (tempFilters.branch) {
                  try { setCurrentPage(''); } catch (e) {}
                }
                // close modal
                setFiltersOpen(false);
              }} className="px-4 py-2 bg-blue-600 text-white rounded">Apply</button>
              <button onClick={() => { setTempFilters({}); setFilterProgram(''); setFilterDepartment(''); setFilterSpecialty(''); setFilterStatus(''); }} className="px-4 py-2 border rounded">Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SemesterGpa: React.FC<{ studentId?: string }> = ({ studentId }) => {
  const [semester, setSemester] = React.useState<number | ''>('');
  const [academicYear, setAcademicYear] = React.useState<string>('');
  const [data, setData] = React.useState<{ gpa: number; totalCredits: number; totalGradePoints: number; count: number } | null>(null);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const run = async () => {
      if (!studentId) return;
      if (semester === '' && !academicYear) return;
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (semester !== '') params.set('semester', String(semester));
        if (academicYear) params.set('academicYear', academicYear);
        const res = await fetchClient.get(`/api/students/${encodeURIComponent(String(studentId))}/gpa/semester?${params.toString()}`);
        if (res.ok) {
          const body = await res.json();
          setData(body?.data || null);
        }
      } finally { setLoading(false); }
    };
    run();
  }, [studentId, semester, academicYear]);

  return (
    <div className="text-xs text-gray-600">
      <div className="flex items-center gap-2">
        <select value={semester} onChange={e=>setSemester(e.target.value ? Number(e.target.value) : '')} className="px-2 py-1 border rounded">
          <option value="">Sem</option>
          {Array.from({ length: 12 }, (_,i)=>i+1).map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={academicYear} onChange={e=>setAcademicYear(e.target.value)} className="px-2 py-1 border rounded">
          <option value="">Year</option>
          {(() => { const y = new Date().getFullYear(); return [ `${y-1}-${y}`, `${y}-${y+1}`, `${y+1}-${y+2}` ]; })().map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {loading ? <span>Loading…</span> : data ? <span>Sem GPA: {data.gpa.toFixed(2)}</span> : null}
      </div>
    </div>
  );
};