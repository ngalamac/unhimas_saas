import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  code: string;
  title: string;
  unit: number;
  department: mongoose.Types.ObjectId;
  program?: mongoose.Types.ObjectId;
  semester?: number;
  caWeight?: number;
  examWeight?: number;
}

const CourseSchema: Schema = new Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  credit: { type: Number, default: 3 },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  program: { type: Schema.Types.ObjectId, ref: 'Program' },
  semester: { type: Number },
  caWeight: { type: Number, default: 0.3 },
  examWeight: { type: Number, default: 0.7 }
}, { timestamps: true });

// ensure weights add to 1
CourseSchema.pre('validate', function(next) {
  const ca = (this as any).caWeight ?? 0.3;
  const ex = (this as any).examWeight ?? 0.7;
  if (Math.abs(ca + ex - 1) > 1e-6) return next(new Error('caWeight and examWeight must sum to 1'));
  next();
});

// derive program from department and validate semester within program duration
CourseSchema.pre('save', async function(next) {
  try {
    const deptId = (this as any).department;
    if (!deptId) return next(new Error('department is required'));
    const Department = (await import('./Department')).default;
    const progModel = (await import('./Program')).default;
    const dept = await Department.findById(deptId).exec();
    if (!dept) return next(new Error('department not found'));
    (this as any).program = dept.program;
    // validate semester within program bounds
    const program = await progModel.findById(dept.program).exec();
    if (program && (this as any).semester) {
      const maxSem = (program.duration ?? 1) * (program.semestersPerYear ?? 1);
      if ((this as any).semester < 1 || (this as any).semester > maxSem) {
        return next(new Error('semester out of bounds for program'));
      }
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

CourseSchema.index({ program: 1, code: 1 }, { unique: true });
CourseSchema.index({ department: 1 });
CourseSchema.index({ program: 1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
