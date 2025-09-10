import mongoose, { Schema, Document } from 'mongoose';

export interface ISpecialty extends Document {
  name: string;
  department: mongoose.Types.ObjectId; // Reference to the Department model
  branch: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialtySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

SpecialtySchema.pre('save', async function(next) {
    if (this.isModified('department')) {
        const Department = (await import('./Department')).default;
        const dept = await Department.findById(this.department);
        if (dept) {
            this.branch = dept.branch;
        }
    }
    next();
});

SpecialtySchema.index({ department: 1 });
SpecialtySchema.index({ branch: 1 });

export default mongoose.model<ISpecialty>('Specialty', SpecialtySchema);
