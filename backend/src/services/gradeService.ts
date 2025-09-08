import Grade from '../models/Grade';
import Course from '../models/Course';
import mongoose from 'mongoose';

export const calculateGpa = async (studentId: string | mongoose.Types.ObjectId) => {
    const grades = await Grade.find({ student: studentId }).populate('course');

    if (grades.length === 0) {
        return { gpa: 0, totalCredits: 0, totalGradePoints: 0 };
    }

    let totalGradePoints = 0;
    let totalCredits = 0;

    for (const grade of grades) {
        const course = grade.course as any;
        if (course && course.credit) {
            totalGradePoints += grade.gradePoints * course.credit;
            totalCredits += course.credit;
        }
    }

    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    return {
        gpa: parseFloat(gpa.toFixed(2)),
        totalCredits,
        totalGradePoints,
    };
};
