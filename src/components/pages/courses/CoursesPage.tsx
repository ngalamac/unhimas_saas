import React, { useEffect, useState } from 'react';
import { getCourses, createCourse, deleteCourse } from '../../../api/courses';
import { Course } from '../../../types/school';
import fetchClient from '../../../lib/fetchClient';
import { Specialty } from '../../../types/school';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    getCourses().then(setCourses).catch(() => {});
    fetchClient.get('/api/specialties').then(res => res.json()).then(data => setSpecialties(data.data || data));
  }, []);

  const handleCreate = async () => {
    if (!specialtyId) {
      alert('Please select a specialty.');
      return;
    }
    const c = await createCourse({ title, code, specialty: specialtyId });
    setCourses(prev => [c, ...prev]);
    setTitle(''); setCode('');
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteCourse(id);
    setCourses(prev => prev.filter(c => (c._id || c.id) !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Courses</h1>
      <div className="mb-4 flex space-x-2">
        <input value={title} onChange={e => setTitle(e.target.value)} className="px-3 py-2 border rounded" placeholder="Course title" />
        <input value={code} onChange={e => setCode(e.target.value)} className="px-3 py-2 border rounded" placeholder="Code" />
        <select value={specialtyId} onChange={e => setSpecialtyId(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">Select Specialty</option>
          {specialties.map(spec => (
            <option key={spec._id || spec.id} value={spec._id || spec.id}>{spec.name}</option>
          ))}
        </select>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">Add Course</button>
      </div>
      <div className="bg-white rounded shadow-sm p-4">
        <ul>
          {courses.map(c => (
            <li key={c._id || c.id} className="flex justify-between border-b py-2">
              <div>
                {c.title || c.name} <span className="text-xs text-gray-500">{c.code}</span>
                <div className="text-sm text-gray-600">
                  Specialty: {typeof c.specialty === 'string' ? c.specialty : c.specialty?.name || 'N/A'}
                </div>
              </div>
              <button onClick={() => handleDelete(c._id || c.id)} className="text-red-600">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CoursesPage;
