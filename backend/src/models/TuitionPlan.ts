import mongoose, { Schema } from 'mongoose';

// TuitionPlan defines the fixed amounts and due dates for a program/department/level
const InstallmentSchema = new Schema({
  key: { type: String, required: true }, // e.g. registration, first, second, third, fourth
  label: { type: String },
  amount: { type: Number, required: true, default: 0 },
  dueDate: { type: Date }, // optional absolute due date
  dueDayOfYear: { type: Number } // optional relative day (e.g. day of year) for recurring schedules
}, { _id: false });

const TuitionPlanSchema = new Schema({
  program: { type: Schema.Types.ObjectId, ref: 'Program' },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  level: { type: Schema.Types.Mixed },
  academicYear: { type: String },
  // registration + up to 4 installments
  installments: { type: [InstallmentSchema], default: [] },
  // allow admin to enable/disable plan
  active: { type: Boolean, default: true },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// unique per program/department/level/academicYear
TuitionPlanSchema.index({ program: 1, department: 1, level: 1, academicYear: 1 }, { unique: true, sparse: true });

export default mongoose.model('TuitionPlan', TuitionPlanSchema);
