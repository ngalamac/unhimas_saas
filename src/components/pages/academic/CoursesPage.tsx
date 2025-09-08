import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, Eye, User, Building2 } from 'lucide-react';
import { Course, Program, Department } from '../../../types/school';
import { getCourses, createCourse, deleteCourse } from '../../../api/courses';
import { getPrograms } from '../../../api/programs';
import { getDepartments } from '../../../api/departments';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
    // Modal state for create/edit/view
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
    const [modalCourse, setModalCourse] = useState<Course | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formCode, setFormCode] = useState('');
    const [formCredit, setFormCredit] = useState(3);
    const [formSpecialtyId, setFormSpecialtyId] = useState('');
    const [formSemester, setFormSemester] = useState(1);
    const [formCAWeight, setFormCAWeight] = useState(0.3);
    const [formExamWeight, setFormExamWeight] = useState(0.7);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [semester, setSemester] = useState<number>(1);
  const [credit, setCredit] = useState<number>(3);
  const [caWeight, setCaWeight] = useState<number>(0.3);
  const [examWeight, setExamWeight] = useState<number>(0.7);

  useEffect(() => { 
    getCourses().then(setCourses).catch(() => {});
    getPrograms().then(setPrograms).catch(()=>{});
    getDepartments().then(setDepartments).catch(()=>{});
    fetchClient.get('/api/specialties').then(res => res.json()).then(setSpecialties).catch(() => {});
  }, []);

  const openModal = (mode: 'create' | 'edit' | 'view', course?: Course) => {
      setModalMode(mode);
      setModalCourse(course || null);
      if (mode === 'edit' && course) {
        setFormTitle(course.title);
        setFormCode(course.code);
        setFormCredit(course.credit || 3);
        setFormSpecialtyId((course.specialty as any)?._id || (course.specialty as any)?.id || '');
        setFormSemester(course.semester || 1);
        setFormCAWeight(course.caWeight ?? 0.3);
        setFormExamWeight(course.examWeight ?? 0.7);
      } else if (mode === 'create') {
        setFormTitle('');
        setFormCode('');
        setFormCredit(3);
        setFormSpecialtyId('');
        setFormSemester(1);
        setFormCAWeight(0.3);
        setFormExamWeight(0.7);
      }
    };

  const filteredCourses = courses.filter(course => {
    const matchesDepartment = !filterDepartment || ((course.department as any)?.id === filterDepartment || (course.department as any)?._id === filterDepartment);
    const matchesLevel = !filterLevel || (course.level ? course.level.toString() === filterLevel : false);
    return matchesDepartment && matchesLevel;
  });

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteCourse(id);
    const handleSaveCourse = async () => {
      if (!formTitle.trim() || !formCode.trim() || !formSpecialtyId || !formCredit || formSemester < 1) {
        alert('All fields are required');
        return;
      }
      if (Math.abs(formCAWeight + formExamWeight - 1) > 1e-6) {
        alert('CA and Exam weights must sum to 1');
        return;
      }
      try {
        const payload = {
            title: formTitle,
            code: formCode,
            credit: formCredit,
            specialty: formSpecialtyId,
            semester: formSemester,
            caWeight: formCAWeight,
            examWeight: formExamWeight
        };

        if (modalMode === 'create') {
          const c = await createCourse(payload as any);
          setCourses(prev => [c, ...prev]);
        } else if (modalMode === 'edit' && modalCourse) {
          const c = await fetchClient.put(`/api/courses/${modalCourse._id || modalCourse.id}`, payload).then(res => res.json());
          setCourses(prev => prev.map(course => (course._id || course.id) === (c._id || c.id) ? c : course));
        }
        setModalMode(null);
      } catch (e) {
        alert('Failed to save course');
      }
    };
    setCourses(prev => prev.filter(c => (c._id || c.id) !== id));
    // Modal component
    const CourseModal = () => {
      if (!modalMode) return null;
      const isView = modalMode === 'view';
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{modalMode === 'create' ? 'Add Course' : modalMode === 'edit' ? 'Edit Course' : 'View Course'}</h2>
            <div className="space-y-4">
              <input disabled={isView} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Course Title" className="w-full px-3 py-2 border rounded" />
              <input disabled={isView} value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="Code" className="w-full px-3 py-2 border rounded" />
              <input disabled={isView} type="number" value={formCredit} onChange={e => setFormCredit(Number(e.target.value))} placeholder="Credit" className="w-full px-3 py-2 border rounded" />
              <select disabled={isView} value={formSpecialtyId} onChange={e => setFormSpecialtyId(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Select Specialty</option>
                {specialties.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
              </select>
              <input disabled={isView} type="number" value={formSemester} onChange={e => setFormSemester(Number(e.target.value))} placeholder="Semester" className="w-full px-3 py-2 border rounded" />
              <input disabled={isView} type="number" step="0.01" value={formCAWeight} onChange={e => setFormCAWeight(Number(e.target.value))} placeholder="CA Weight" className="w-full px-3 py-2 border rounded" />
              <input disabled={isView} type="number" step="0.01" value={formExamWeight} onChange={e => setFormExamWeight(Number(e.target.value))} placeholder="Exam Weight" className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={() => setModalMode(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              {!isView && (
                <button onClick={handleSaveCourse} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              )}
            </div>
          </div>
        </div>
      );
    };
  };

  // edit/save flow not implemented yet for courses; update handler omitted to avoid unused symbol

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600">Manage all courses, credits, and lecturers</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2" onClick={() => openModal('create')}>
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={(d._id || (d as any).id)} value={(d._id || (d as any).id) as string}>{d.name}</option>)}
          </select>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
          </select>
        </div>
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
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
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