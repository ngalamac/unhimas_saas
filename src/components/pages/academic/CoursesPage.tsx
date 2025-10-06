import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import fetchClient from '../../../lib/fetchClient';
import { BookOpen, Plus, Edit, Trash2, Eye, User, Building2, X } from 'lucide-react';
import { Course, Program, Department } from '../../../types/school';
import { createCourse, updateCourse, deleteCourse } from '../../../api/courses';
import { getPrograms } from '../../../api/programs';
import { getDepartments } from '../../../api/departments';

// Stable modal component extracted to avoid remount on each parent render
interface CourseModalProps {
  mode: 'create' | 'edit' | 'view' | null;
  onClose: () => void;
  programs: Program[];
  departments: Department[];
  formTitle: string; setFormTitle: (v: string) => void;
  formCode: string; setFormCode: (v: string) => void;
  formCredit: number; setFormCredit: (v: number) => void;
  formProgramId: string; setFormProgramId: (v: string) => void;
  formDepartmentId: string; setFormDepartmentId: (v: string) => void;
  formSemester: number; setFormSemester: (v: number) => void;
  formCAWeight: number; setFormCAWeight: (v: number) => void;
  formExamWeight: number; setFormExamWeight: (v: number) => void;
  isFormValid: () => boolean;
  onSave: () => void;
}

const RawCourseModal: React.FC<CourseModalProps> = ({
  mode, onClose, programs, departments,
  formTitle, setFormTitle,
  formCode, setFormCode,
  formCredit, setFormCredit,
  formProgramId, setFormProgramId,
  formDepartmentId, setFormDepartmentId,
  formSemester, setFormSemester,
  formCAWeight, setFormCAWeight,
  formExamWeight, setFormExamWeight,
  isFormValid, onSave
}) => {
  if (!mode) return null;
  const isView = mode === 'view';
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!isView) titleRef.current?.focus(); }, [isView]);
  const prog = programs?.find?.(p => (p as any)?._id === formProgramId || (p as any)?.id === formProgramId);
  const duration = typeof prog?.duration === 'number' && prog.duration > 0 ? prog.duration : 1;
  const semPerYear = typeof prog?.semestersPerYear === 'number' && prog.semestersPerYear > 0 ? prog.semestersPerYear : 2;
  const maxSem = duration * semPerYear || 1;
  const safeSemesterOptions = Array.from({ length: Math.min(60, Math.max(1, maxSem)) }, (_,i)=>i+1);
  const currentSum = Number((formCAWeight ?? 0)) + Number((formExamWeight ?? 0));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl flex flex-col max-h-[90vh]" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{mode === 'create' ? 'Add Course' : mode === 'edit' ? 'Edit Course' : 'View Course'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input ref={titleRef} disabled={isView} value={formTitle} onChange={e=>setFormTitle(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Course Title" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
              <input disabled={isView} value={formCode} onChange={e=>setFormCode(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Code" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Credit *</label>
              <input disabled={isView} type="number" value={formCredit} onChange={e=>setFormCredit(Number(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Program *</label>
              <select disabled={isView} value={formProgramId} onChange={e=>{setFormProgramId(e.target.value); setFormSemester(1);}} className="w-full px-3 py-2 border rounded">
                <option value="">Select Program</option>
                {programs.map(p=> <option key={(p._id || (p as any).id)} value={(p._id || (p as any).id) as string}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department *</label>
              <select disabled={isView} value={formDepartmentId} onChange={e=>setFormDepartmentId(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Select Department</option>
                {departments.map(d=> <option key={(d._id || (d as any).id)} value={(d._id || (d as any).id) as string}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester *</label>
              <select disabled={isView} value={formSemester} onChange={e=>setFormSemester(Number(e.target.value) || 1)} className="w-full px-3 py-2 border rounded">
                {safeSemesterOptions.map(s=> <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Specialty (optional)</label>
              <select disabled={isView || !(formProgramId && formDepartmentId)} value={formSpecialtyId} onChange={e=>setFormSpecialtyId(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">{!(formProgramId && formDepartmentId) ? 'Select Program & Department first' : 'Select Specialty'}</option>
                {specialties
                  .filter(s => (!formProgramId || String(s.program) === String(formProgramId)) && (!formDepartmentId || String(s.department) === String(formDepartmentId)))
                  .map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CA Weight *</label>
              <input disabled={isView} type="number" step="0.01" min={0} max={1} value={formCAWeight} onChange={e=>setFormCAWeight(Number(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exam Weight *</label>
              <input disabled={isView} type="number" step="0.01" min={0} max={1} value={formExamWeight} onChange={e=>setFormExamWeight(Number(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          <p className="text-xs text-gray-500">CA + Exam weights must sum to 1. Currently: {currentSum.toFixed(2)}</p>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <div className="text-xs text-gray-500">{!isFormValid() && !isView && 'Complete required fields.'}</div>
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm">Cancel</button>
            {!isView && (
              <button disabled={!isFormValid()} onClick={onSave} className={`px-4 py-2 rounded text-sm ${isFormValid() ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Save</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseModal = React.memo(RawCourseModal);

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filterProgram, setFilterProgram] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [search, setSearch] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specialties, setSpecialties] = useState<Array<{ _id: string; name: string; program: string; department: string }>>([]);
  // Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [modalCourse, setModalCourse] = useState<Course | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCredit, setFormCredit] = useState(3);
  const [formProgramId, setFormProgramId] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formSemester, setFormSemester] = useState(1);
  const [formCAWeight, setFormCAWeight] = useState(0.3);
  const [formExamWeight, setFormExamWeight] = useState(0.7);
  const [formSpecialtyId, setFormSpecialtyId] = useState('');

  // Initial fetch of programs & departments
  useEffect(() => { 
    getPrograms().then(resp => {
      const list: any = (resp as any)?.data || resp;
      setPrograms(Array.isArray(list) ? list : []);
    }).catch(()=>{});
    getDepartments().then(resp => {
      const list: any = (resp as any)?.data || resp;
      setDepartments(Array.isArray(list) ? list : []);
    }).catch(()=>{});
  }, []);

  // Fetch courses whenever filterProgram / filterDepartment / filterSemester changes
  useEffect(() => {
    const fetch = async () => {
      const params = new URLSearchParams();
      if (filterProgram) params.append('programId', filterProgram);
      if (filterDepartment) params.append('departmentId', filterDepartment);
      if (filterSemester) params.append('semester', filterSemester);
      if (filterSpecialty) params.append('specialtyId', filterSpecialty);
      const url = '/api/courses' + (params.toString() ? `?${params.toString()}` : '');
      try {
        const res = await fetchClient.get(url);
        if (!res.ok) return; // error already globally handled
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
      } catch {}
    };
    fetch();
  }, [filterProgram, filterDepartment, filterSemester, filterSpecialty]);

  // Load specialties list when program or department changes
  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams();
      if (filterProgram) params.set('program', filterProgram);
      if (filterDepartment) params.set('department', filterDepartment);
      try {
        const res = await fetchClient.get(`/api/specialties${params.toString() ? `?${params.toString()}` : ''}`);
        if (!res.ok) { setSpecialties([]); return; }
        const body = await res.json();
        const list = Array.isArray(body) ? body : (body.data || []);
        setSpecialties(list);
      } catch { setSpecialties([]); }
    };
    load();
  }, [filterProgram, filterDepartment]);

  // Ensure semester value stays within bounds if program changes
  useEffect(() => {
    if (!filterProgram || !filterSemester) return;
    const prog = programs.find(p => (p._id || (p as any).id) === filterProgram || (p as any).id === filterProgram);
    if (prog) {
      const maxSem = ((prog.duration ?? 1) * (prog.semestersPerYear ?? 1)) || 1;
      if (Number(filterSemester) > maxSem) setFilterSemester('');
    }
  }, [filterProgram, filterSemester, programs]);

  const openModal = useCallback((mode: 'create' | 'edit' | 'view', course?: Course) => {
    setModalMode(mode);
    setModalCourse(course || null);
    if (mode === 'edit' && course) {
      setFormTitle(course.title || '');
      setFormCode(course.code || '');
      setFormCredit(course.credit || (course as any).creditValue || 3);
      setFormProgramId((course.program as any)?._id || (course.program as any)?.id || '');
      setFormDepartmentId((course.department as any)?._id || (course.department as any)?.id || '');
      setFormSemester(course.semester || 1);
      setFormSpecialtyId(((course as any).specialty && ((course as any).specialty._id || (course as any).specialty.id)) || '');
      setFormCAWeight(course.caWeight ?? 0.3);
      setFormExamWeight(course.examWeight ?? 0.7);
    } else if (mode === 'create') {
      setFormTitle('');
      setFormCode('');
      setFormCredit(3);
      setFormProgramId('');
      setFormDepartmentId('');
      setFormSemester(1);
      setFormCAWeight(0.3);
      setFormExamWeight(0.7);
      setFormSpecialtyId('');
    }
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = !search || (course.title || '').toLowerCase().includes(search.toLowerCase()) || (course.code || '').toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [courses, search]);

  const isFormValid = () => {
    if (!formTitle.trim() || !formCode.trim()) return false;
    if (!formProgramId) return false;
  // department is required by backend (title, code, department)
  if (!formDepartmentId) return false;
    if (!formCredit || formCredit <= 0) return false;
    if (Math.abs(formCAWeight + formExamWeight - 1) > 1e-6) return false;
    const prog = programs.find(p => (p._id || (p as any).id) === formProgramId || (p as any).id === formProgramId);
    if (prog) {
      const maxSem = ((prog.duration ?? 1) * (prog.semestersPerYear ?? 1)) || 1;
      if (formSemester < 1 || formSemester > maxSem) return false;
    }
    return true;
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const original = courses;
    setCourses(prev => prev.filter(c => (c._id || (c as any).id) !== id));
    try {
      await deleteCourse(id);
      try { (window as any).__UI_BRIDGE__?.showToast?.('Course deleted'); } catch {}
    } catch (e) {
      setCourses(original); // rollback
      alert('Failed to delete course');
    }
  };

  const handleSaveCourse = async () => {
    if (!isFormValid()) {
      alert('Please fill all required fields and ensure CA + Exam weights sum to 1.');
      return;
    }
    const payload: any = {
      title: formTitle,
      code: formCode,
      credit: formCredit,
      program: formProgramId,
      department: formDepartmentId,
      specialty: formSpecialtyId || undefined,
      semester: formSemester,
      caWeight: formCAWeight,
      examWeight: formExamWeight
    };
    try {
      if (modalMode === 'create') {
        const createdResp = await createCourse(payload as any);
        const created: any = (createdResp as any)?.data || createdResp;
        setCourses(prev => [created, ...prev]);
      } else if (modalMode === 'edit' && modalCourse) {
        const updatedResp = await updateCourse((modalCourse._id || (modalCourse as any).id) as string, payload);
        const updated: any = (updatedResp as any)?.data || updatedResp;
        setCourses(prev => prev.map(c => (c._id || (c as any).id) === (updated._id || (updated as any).id) ? updated : c));
      }
      setModalMode(null);
    } catch (e) {
      const errAny = e as any;
      const msg = (errAny && errAny.message) ? errAny.message : 'Failed to save course';
      try { (window as any).__UI_BRIDGE__?.showToast?.(msg); } catch {}
      alert(msg);
    }
  };

  // removed inline memo modal (replaced by stable external component)

  // edit/save flow not implemented yet for courses; update handler omitted to avoid unused symbol

  return (
    <div className="p-6">
      <CourseModal
        mode={modalMode}
        onClose={()=>setModalMode(null)}
        programs={programs}
        departments={departments}
        formTitle={formTitle} setFormTitle={setFormTitle}
        formCode={formCode} setFormCode={setFormCode}
        formCredit={formCredit} setFormCredit={setFormCredit}
        formProgramId={formProgramId} setFormProgramId={setFormProgramId}
        formDepartmentId={formDepartmentId} setFormDepartmentId={setFormDepartmentId}
        formSemester={formSemester} setFormSemester={setFormSemester}
        formCAWeight={formCAWeight} setFormCAWeight={setFormCAWeight}
        formExamWeight={formExamWeight} setFormExamWeight={setFormExamWeight}
        isFormValid={isFormValid}
        onSave={handleSaveCourse}
      />
      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <p className="text-gray-600">Manage all courses, credits, and lecturers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Lecturers</p>
              <p className="text-xl font-bold text-gray-900">
                {courses.filter(c => c.lecturer).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Credits</p>
              <p className="text-xl font-bold text-gray-900">
                {courses.reduce((sum, course) => sum + ((course.creditValue as number) || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Departments</p>
              <p className="text-xl font-bold text-gray-900">
                {new Set(courses.map(c => ((c.department as any)?._id || (c.department as any)?.id))).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <select value={filterProgram} onChange={e=>setFilterProgram(e.target.value)} className="px-3 py-2 border rounded text-sm">
              <option value="">All Programs</option>
              {programs.map(p=> <option key={(p._id || (p as any).id)} value={(p._id || (p as any).id) as string}>{p.name}</option>)}
            </select>
            <select value={filterDepartment} onChange={e=>setFilterDepartment(e.target.value)} className="px-3 py-2 border rounded text-sm">
              <option value="">All Departments</option>
              {departments.map(d=> <option key={(d._id || (d as any).id)} value={(d._id || (d as any).id) as string}>{d.name}</option>)}
            </select>
            <select value={filterSemester} onChange={e=>setFilterSemester(e.target.value)} className="px-3 py-2 border rounded text-sm">
              <option value="">All Semesters</option>
              {Array.from({ length: 12 }, (_,i)=>i+1).map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <select value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} className="px-3 py-2 border rounded text-sm">
              <option value="">All Specialties</option>
              {specialties.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title or code" className="px-3 py-2 border rounded text-sm w-56" />
          </div>
          <button onClick={()=>openModal('create')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Course</span>
          </button>
        </div>
        <p className="text-xs text-gray-500">Filters apply instantly. Use search to narrow by title/code.</p>
      </div>

      {/* Courses Table */}
  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No courses found. Adjust filters or add a new course.</td>
                  </tr>
                )}
                {filteredCourses.map((course) => (
                <tr key={course._id || course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{course.title || course.name}</div>
                      <div className="text-sm text-gray-500">{course.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(course.department as any)?.name}</div>
                    <div className="text-sm text-gray-500">{(course.department as any)?.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Level {course.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Semester {course.semester}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {(course.credit || (course.creditValue as number) || 0)} Credits
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.lecturer ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {(course.lecturer as any).firstName} {(course.lecturer as any).lastName}
                        </div>
                        <div className="text-sm text-gray-500">{(course.lecturer as any).email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-red-600">Not Assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" onClick={()=>openModal('view', course)}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" onClick={()=>openModal('edit', course)}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(course._id || course.id)} className="text-red-600 hover:text-red-900">
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
    </div>
  );
};