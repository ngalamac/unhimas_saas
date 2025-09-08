import mongoose, { Document, Schema } from 'mongoose';
import { ICourse } from './Course';

export interface IGrade extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId | ICourse;
  academicYear: string;
  semester: number;
  ca_mark?: number;
  exam_mark?: number;
  total_mark: number;
  grade_point: number;
  createdBy: mongoose.Types.ObjectId;
}

const GradeSchema: Schema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  academicYear: { type: String, required: true },
  semester: { type: Number, required: true },
  ca_mark: { type: Number, default: 0 },
  exam_mark: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Ensure a student has only one grade entry per course per semester/year
GradeSchema.index({ student: 1, course: 1, academicYear: 1, semester: 1 }, { unique: true });

// Virtual property for total mark
GradeSchema.virtual('total_mark').get(function(this: IGrade) {
  if (!this.populated('course')) {
    // If course is not populated, we can't calculate total. Return a placeholder.
    // In practice, we should always populate 'course' when we need this virtual.
    return 0;
  }
  const course = this.course as ICourse;
  const ca_contrib = (this.ca_mark || 0) * (course.caWeight || 0.3);
  const exam_contrib = (this.exam_mark || 0) * (course.examWeight || 0.7);
  return ca_contrib + exam_contrib;
});

// Virtual property for GPA (example using a simple 4.0 scale)
GradeSchema.virtual('grade_point').get(function(this: IGrade) {
    const total = this.total_mark;
    if (total >= 80) return 4.0;
    if (total >= 75) return 3.5;
    if (total >= 70) return 3.0;
    if (total >= 65) return 2.5;
    if (total >= 60) return 2.0;
    if (total >= 55) return 1.5;
    if (total >= 50) return 1.0;
    return 0.0;
});

// Ensure virtuals are included when converting to JSON
GradeSchema.set('toJSON', { virtuals: true });
GradeSchema.set('toObject', { virtuals: true });

export default mongoose.model<IGrade>('Grade', GradeSchema);
