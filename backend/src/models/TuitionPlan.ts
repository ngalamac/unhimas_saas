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
  name: { type: String, required: true, trim: true },
  program: { type: Schema.Types.ObjectId, ref: 'Program' },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  level: { type: Schema.Types.Mixed },
  academicYear: { type: String },
  // Targeting groups (multi-assignment). If arrays non-empty, any match qualifies a student.
  programs: [{ type: Schema.Types.ObjectId, ref: 'Program' }],
  departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  levels: [{ type: Schema.Types.Mixed }],
  specialities: [{ type: String }], // free-form or could ref another model
  // registration + up to N installments
  installments: { type: [InstallmentSchema], default: [] },
  // allow admin to enable/disable plan
  active: { type: Boolean, default: true },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// unique per program/department/level/academicYear
// legacy uniqueness kept but not strictly unique now due to grouping arrays; keep sparse to avoid collisions.
TuitionPlanSchema.index({ program: 1, department: 1, level: 1, academicYear: 1 });
// Text & targeting indexes
TuitionPlanSchema.index({ name: 'text' });
TuitionPlanSchema.index({ academicYear: 1, active: 1 });
TuitionPlanSchema.index({ 'programs': 1 });
TuitionPlanSchema.index({ 'departments': 1 });
TuitionPlanSchema.index({ 'levels': 1 });
TuitionPlanSchema.index({ 'specialities': 1 });

export default mongoose.model('TuitionPlan', TuitionPlanSchema);
