import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  code: string;
  title: string;
  credit: number;
  specialty: mongoose.Types.ObjectId;
  program?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  branch?: mongoose.Types.ObjectId;
  semester?: number;
  caWeight?: number;
  examWeight?: number;
}

const CourseSchema: Schema = new Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  credit: { type: Number, default: 3, required: true },
  specialty: { type: Schema.Types.ObjectId, ref: 'Specialty', required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  program: { type: Schema.Types.ObjectId, ref: 'Program' },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
  semester: { type: Number, required: true },
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

// derive department and program from specialty, and validate semester within program duration
CourseSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('specialty')) {
      return next();
    }

    const Specialty = (await import('./Specialty')).default;
    const specialty = await Specialty.findById(this.specialty).populate({
      path: 'department',
      populate: {
        path: 'program'
      }
    });

    if (!specialty) {
      return next(new Error('Specialty not found'));
    }

    this.department = specialty.department._id;
    this.program = (specialty.department as any).program._id;
    this.branch = (specialty.department as any).program.branch;

    const program = (specialty.department as any).program;
    if (program && this.semester) {
      const maxSem = (program.duration ?? 1) * (program.semestersPerYear ?? 1);
      if (this.semester < 1 || this.semester > maxSem) {
        return next(new Error('Semester is out of bounds for the program duration.'));
      }
    }

    next();
  } catch (err) {
    next(err as any);
  }
});

CourseSchema.index({ program: 1, code: 1 }, { unique: true });

export default mongoose.model<ICourse>('Course', CourseSchema);
