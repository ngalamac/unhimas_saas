import { Student } from './school';
import { Course } from './school';

export interface Grade {
    _id: string;
    student: Student | string;
    course: Course | string;
    grade: number;
    gpa: number;
    semester: number;
    academicYear: string;
    createdAt: string;
    updatedAt: string;
}

export interface GpaData {
    gpa: number;
    totalCredits: number;
    totalGradePoints: number;
    grades: Grade[];
}
