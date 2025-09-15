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
    const doc: any = this as any;
    const deptId = doc.department;
    if (!deptId) return next(new Error('department is required'));
    const Department = (await import('./Department')).default;
    const Program = (await import('./Program')).default;
    const dept = await Department.findById(deptId).exec();
    if (!dept) return next(new Error('department not found'));
    // only set program from department if doc does not already have a program explicitly
    if (!doc.program && dept.program) {
      doc.program = dept.program;
    }
    const currentProgramId = doc.program || dept.program;
    if (currentProgramId) {
      const program = await Program.findById(currentProgramId).exec();
      if (program && doc.semester) {
        const maxSem = (program.duration ?? 1) * (program.semestersPerYear ?? 1);
        if (doc.semester < 1 || doc.semester > maxSem) {
          return next(new Error('semester out of bounds for program'));
        }
      }
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

CourseSchema.index({ program: 1, code: 1 }, { unique: true });

export default mongoose.model<ICourse>('Course', CourseSchema);
