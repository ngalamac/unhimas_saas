import React, { useEffect, useState } from 'react';
import fetchClient from '../../../lib/fetchClient';
import { BookOpen } from 'lucide-react';

// Define types locally for now, should be moved to a shared types folder
interface ICourse {
    _id: string;
    code: string;
    title: string;
    credit: number;
}

interface IGrade {
    _id: string;
    student: string;
    course: ICourse;
    academicYear: string;
    semester: number;
    ca_mark?: number;
    exam_mark?: number;
    total_mark: number;
    grade_point: number;
}

interface ReportCardProps {
    studentId: string;
}

interface SemesterStats {
    gpa: number;
    totalCredits: number;
}

interface GroupedGrades {
    [key: string]: {
        grades: IGrade[];
        stats: SemesterStats;
    };
}

export const ReportCardPage: React.FC<ReportCardProps> = ({ studentId }) => {
    const [grades, setGrades] = useState<IGrade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            setLoading(true);
            fetchClient.get(`/api/grades/student/${studentId}`)
                .then(res => res.json())
                .then(setGrades)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [studentId]);

    const { groupedGrades, cumulativeGpa } = React.useMemo(() => {
        const grouped: GroupedGrades = {};
        let totalCredits = 0;
        let totalGradePoints = 0;

        grades.forEach(grade => {
            const key = `${grade.academicYear} - Semester ${grade.semester}`;
            if (!grouped[key]) {
                grouped[key] = { grades: [], stats: { gpa: 0, totalCredits: 0 } };
            }
            grouped[key].grades.push(grade);
        });

        for (const key in grouped) {
            let semesterCredits = 0;
            let semesterGradePoints = 0;
            grouped[key].grades.forEach(grade => {
                const credit = (grade.course as any).credit || 0;
                semesterCredits += credit;
                semesterGradePoints += grade.grade_point * credit;
            });
            grouped[key].stats.totalCredits = semesterCredits;
            grouped[key].stats.gpa = semesterCredits > 0 ? semesterGradePoints / semesterCredits : 0;

            totalCredits += semesterCredits;
            totalGradePoints += semesterGradePoints;
        }

        const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

        return { groupedGrades: grouped, cumulativeGpa: cgpa };
    }, [grades]);

    if (loading) {
        return <div className="text-center p-10">Loading report card...</div>;
    }

    if (grades.length === 0) {
        return <div className="text-center p-10">No grades found for this student.</div>;
    }

    return (
        <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Student Report Card</h1>
                <div className="text-right">
                    <p className="font-bold text-lg">Cumulative GPA (CGPA)</p>
                    <p className="text-2xl font-bold text-blue-600">{cumulativeGpa.toFixed(2)}</p>
                </div>
            </div>

            <div className="space-y-8">
                {Object.entries(groupedGrades).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, { grades, stats }]) => (
                    <div key={key} className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">{key}</h2>
                            <div className="text-right">
                                <p className="font-semibold text-md">Semester GPA (SGPA)</p>
                                <p className="text-xl font-bold text-gray-700">{stats.gpa.toFixed(2)}</p>
                            </div>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course Code</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course Title</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Credits</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">CA (30)</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Exam (70)</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Grade Point</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {grades.map(grade => (
                                    <tr key={grade._id}>
                                        <td className="px-4 py-3 text-sm text-gray-600">{(grade.course as any).code}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{(grade.course as any).title}</td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{(grade.course as any).credit}</td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{grade.ca_mark}</td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{grade.exam_mark}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold text-gray-800">{grade.total_mark.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold text-blue-600">{grade.grade_point.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportCardPage;
