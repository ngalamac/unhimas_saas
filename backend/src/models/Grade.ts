import mongoose, { Schema, Document } from 'mongoose';

export const gradingScale = {
    'A': 4.0,
    'B+': 3.5,
    'B': 3.0,
    'C+': 2.5,
    'C': 2.0,
    'D+': 1.5,
    'D': 1.0,
    'F': 0.0,
};

export interface IGrade extends Document {
    student: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    semester: number;
    academicYear: string;
    caScore: number;
    examScore: number;
    totalScore: number;
    letterGrade: keyof typeof gradingScale;
    gradePoints: number;
    createdBy: mongoose.Types.ObjectId;
}

const GradeSchema: Schema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true },
    caScore: { type: Number, required: true },
    examScore: { type: Number, required: true },
    totalScore: { type: Number, required: true },
    letterGrade: { type: String, enum: Object.keys(gradingScale), required: true },
    gradePoints: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

GradeSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });
GradeSchema.index({ student: 1 });
GradeSchema.index({ course: 1 });

export default mongoose.model<IGrade>('Grade', GradeSchema);
