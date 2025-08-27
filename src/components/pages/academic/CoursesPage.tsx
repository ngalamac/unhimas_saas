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
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [semester, setSemester] = useState<number>(1);
  const [credit, setCredit] = useState<number>(3);
  const [caWeight, setCaWeight] = useState<number>(0.3);
  const [examWeight, setExamWeight] = useState<number>(0.7);

  useEffect(() => { 
    getCourses().then(setCourses).catch(() => {});
    getPrograms().then(setPrograms).catch(()=>{});
    getDepartments().then(setDepartments).catch(()=>{});
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesDepartment = !filterDepartment || ((course.department as any)?.id === filterDepartment || (course.department as any)?._id === filterDepartment);
    const matchesLevel = !filterLevel || (course.level ? course.level.toString() === filterLevel : false);
    return matchesDepartment && matchesLevel;
  });

  const isFormValid = () => {
    if (!title.trim() || !code.trim()) return false;
    if (!selectedProgramId) return false;
    if (!credit || credit <= 0) return false;
    if (Math.abs(caWeight + examWeight - 1) > 1e-6) return false;
    // ensure semester within program bounds
    const prog = programs.find(p => (p._id || (p as any).id) === selectedProgramId || (p as any).id === selectedProgramId);
    if (prog) {
      const maxSem = ((prog.duration ?? 1) * (prog.semestersPerYear ?? 1)) || 1;
      if (semester < 1 || semester > maxSem) return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!isFormValid()) return alert('Please fill all required fields and ensure CA + Exam weights sum to 1.');
    try {
    const payload = { title, code, credit, program: selectedProgramId, department: selectedDepartmentId || undefined, semester, caWeight, examWeight };
      const c = await createCourse(payload as any);
      setCourses(prev => [c, ...prev]);
      setTitle(''); setCode(''); setSelectedProgramId(''); setSemester(1); setCredit(3); setCaWeight(0.3); setExamWeight(0.7);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteCourse(id);
    setCourses(prev => prev.filter(c => (c._id || c.id) !== id));
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
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
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
          <div className="flex space-x-2">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Course title" className="px-3 py-2 border rounded" />
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Code" className="px-3 py-2 border rounded" />
            <select value={selectedProgramId} onChange={e=>{ setSelectedProgramId(e.target.value); setSemester(1); }} className="px-3 py-2 border rounded">
              <option value="">Select Program</option>
              {programs.map(p=> <option key={(p._id || (p as any).id)} value={(p._id || (p as any).id) as string}>{p.name}</option>)}
            </select>
            <select id="department" value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(e.target.value)} className="px-3 py-2 border rounded">
              <option value="">Select Department</option>
              {departments.map(d=> <option key={(d._id || (d as any).id)} value={(d._id || (d as any).id) as string}>{d.name}</option>) }
            </select>
            <input id="credit" type="number" value={credit} onChange={e=>setCredit(Number(e.target.value))} className="px-3 py-2 border rounded w-20" />
            <select value={semester} onChange={e=>setSemester(Number(e.target.value))} className="px-3 py-2 border rounded w-32">
              {(() => {
                const prog = programs.find(p => (p._id || (p as any).id) === selectedProgramId || (p as any).id === selectedProgramId);
                const maxSem = prog ? ( (prog.duration ?? 1) * (prog.semestersPerYear ?? 1) ) : 12;
                return Array.from({ length: maxSem }, (_, i) => i + 1).map(s => <option key={s} value={s}>Sem {s}</option>);
              })()}
            </select>
            <input value={caWeight} onChange={e=>setCaWeight(Number(e.target.value))} type="number" step="0.01" min="0" max="1" className="px-3 py-2 border rounded w-20" title="CA weight (0-1)" />
            <input value={examWeight} onChange={e=>setExamWeight(Number(e.target.value))} type="number" step="0.01" min="0" max="1" className="px-3 py-2 border rounded w-20" title="Exam weight (0-1)" />
            <button onClick={handleCreate} disabled={!isFormValid()} className={`px-4 py-2 rounded ${isFormValid() ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Create</button>
          </div>
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
          <div></div>
          <div></div>
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