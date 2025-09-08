import PDFDocument from 'pdfkit';
import { IStudent } from '../models/Student';
import Grade from '../models/Grade';
import Course from '../models/Course';
import { calculateGpa } from './gradeService';

export const generateTranscript = async (student: IStudent): Promise<Buffer> => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Header
    doc.fontSize(20).text('Official Academic Transcript', { align: 'center' });
    doc.moveDown();

    // Student Info
    doc.fontSize(12).text(`Name: ${student.names}`);
    doc.text(`Student ID: ${student.studentId}`);
    doc.moveDown();

    const grades = await Grade.find({ student: student._id }).populate('course').sort({ academicYear: 1, semester: 1 });

    const gradesBySemester = grades.reduce((acc, grade) => {
        const key = `${grade.academicYear} - Semester ${grade.semester}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(grade);
        return acc;
    }, {} as Record<string, any[]>);

    for (const semesterKey in gradesBySemester) {
        doc.fontSize(14).text(semesterKey, { underline: true });
        doc.moveDown(0.5);

        let semesterGradePoints = 0;
        let semesterCredits = 0;

        for (const grade of gradesBySemester[semesterKey]) {
            const course = grade.course as any;
            const courseCredits = course ? course.credit : 0;
            doc.fontSize(10).text(`${course.code} - ${course.title}: ${grade.letterGrade} (${grade.gradePoints})`);
            semesterGradePoints += grade.gradePoints * courseCredits;
            semesterCredits += courseCredits;
        }

        const semesterGpa = semesterCredits > 0 ? (semesterGradePoints / semesterCredits).toFixed(2) : 'N/A';
        doc.fontSize(10).text(`Semester GPA: ${semesterGpa}`);
        doc.moveDown();
    }

    const overallGpa = await calculateGpa(student._id);
    doc.fontSize(12).text(`Cumulative GPA: ${overallGpa.gpa}`, { align: 'right' });

    return new Promise((resolve, reject) => {
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.end();
    });
};
