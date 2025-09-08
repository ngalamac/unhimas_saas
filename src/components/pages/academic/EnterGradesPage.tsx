import React, { useEffect, useState } from 'react';
import fetchClient from '../../../lib/fetchClient';
import { BookOpen, GraduationCap, Save, Users } from 'lucide-react';

interface Specialty { _id: string; name: string; }
interface Course { _id: string; title: string; code: string; }
interface Student { _id: string; firstName: string; lastName: string; studentId: string; }
interface GradeInput {
    studentId: string;
    ca_mark?: number;
    exam_mark?: number;
}

export const EnterGradesPage: React.FC = () => {
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<Record<string, GradeInput>>({});

    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    const [selectedSemester, setSelectedSemester] = useState<number | ''>('');

    const [loading, setLoading] = useState({ specialties: false, courses: false, students: false });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(p => ({ ...p, specialties: true }));
        fetchClient.get('/api/specialties')
            .then(res => res.json())
            .then(setSpecialties)
            .finally(() => setLoading(p => ({ ...p, specialties: false })));
    }, []);

    useEffect(() => {
        if (selectedSpecialty) {
            setLoading(p => ({ ...p, courses: true }));
            fetchClient.get(`/api/courses?specialtyId=${selectedSpecialty}`)
                .then(res => res.json())
                .then(setCourses)
                .finally(() => setLoading(p => ({ ...p, courses: false })));
        } else {
            setCourses([]);
        }
    }, [selectedSpecialty]);

    useEffect(() => {
        if (selectedCourse) {
            setLoading(p => ({ ...p, students: true }));
            // This endpoint doesn't exist yet, but it's what we need.
            // It should fetch all students enrolled in the specialty of the selected course.
            fetchClient.get(`/api/students?specialty=${selectedSpecialty}`)
                .then(res => res.json())
                .then(data => setStudents(data.data || []))
                .finally(() => setLoading(p => ({ ...p, students: false })));
        } else {
            setStudents([]);
        }
    }, [selectedCourse, selectedSpecialty]);

    const handleGradeChange = (studentId: string, field: 'ca_mark' | 'exam_mark', value: string) => {
        const numericValue = value === '' ? undefined : Number(value);
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                studentId,
                [field]: numericValue,
            }
        }));
    };

    const handleSubmit = async () => {
        if (!selectedCourse || !selectedAcademicYear || !selectedSemester || Object.keys(grades).length === 0) {
            alert('Please select a course, academic year, semester, and enter at least one grade.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                courseId: selectedCourse,
                academicYear: selectedAcademicYear,
                semester: selectedSemester,
                grades: Object.values(grades).filter(g => g.ca_mark !== undefined || g.exam_mark !== undefined),
            };
            await fetchClient.post('/api/grades/bulk', payload);
            alert('Grades submitted successfully!');
            setGrades({});
        } catch (error) {
            console.error(error);
            alert('Failed to submit grades.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Enter Student Grades</h1>
                <p className="text-gray-600">Select a course and enter the CA and Exam marks for each student.</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select onChange={e => setSelectedSpecialty(e.target.value)} value={selectedSpecialty} className="w-full px-3 py-2 border rounded-lg">
                        <option value="">{loading.specialties ? 'Loading...' : 'Select Specialty'}</option>
                        {specialties.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    <select onChange={e => setSelectedCourse(e.target.value)} value={selectedCourse} className="w-full px-3 py-2 border rounded-lg" disabled={!selectedSpecialty}>
                        <option value="">{loading.courses ? 'Loading...' : 'Select Course'}</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.title}</option>)}
                    </select>
                    <select onChange={e => setSelectedAcademicYear(e.target.value)} value={selectedAcademicYear} className="w-full px-3 py-2 border rounded-lg">
                        {(() => {
                            const y = new Date().getFullYear();
                            return [`${y}-${y+1}`, `${y-1}-${y}`, `${y+2}-${y+3}`].map(o => <option key={o} value={o}>{o}</option>);
                        })()}
                    </select>
                    <select onChange={e => setSelectedSemester(Number(e.target.value))} value={selectedSemester} className="w-full px-3 py-2 border rounded-lg">
                        <option value="">Select Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA Mark (30)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Mark (70)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading.students ? (
                            <tr><td colSpan={4} className="text-center py-10">Loading students...</td></tr>
                        ) : students.length > 0 ? (
                            students.map(student => (
                                <tr key={student._id}>
                                    <td className="px-6 py-4">{student.studentId}</td>
                                    <td className="px-6 py-4">{student.lastName} {student.firstName}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            max="30" min="0"
                                            value={grades[student._id]?.ca_mark ?? ''}
                                            onChange={e => handleGradeChange(student._id, 'ca_mark', e.target.value)}
                                            className="w-24 px-2 py-1 border rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            max="70" min="0"
                                            value={grades[student._id]?.exam_mark ?? ''}
                                            onChange={e => handleGradeChange(student._id, 'exam_mark', e.target.value)}
                                            className="w-24 px-2 py-1 border rounded"
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="text-center py-10 text-gray-500">Select a course to see enrolled students.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || students.length === 0}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:bg-blue-300"
                >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Submitting...' : 'Submit Grades'}</span>
                </button>
            </div>
        </div>
    );
};

export default EnterGradesPage;
