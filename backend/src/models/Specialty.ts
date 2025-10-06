import mongoose, { Schema, Document } from 'mongoose';

export interface ISpecialty extends Document {
  name: string;
  program: mongoose.Types.ObjectId; // parent program
  department: mongoose.Types.ObjectId; // parent department
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

const SpecialtySchema: Schema = new Schema({
  name: { type: String, required: true },
  program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

SpecialtySchema.index({ name: 1, department: 1, program: 1 }, { unique: true });

export default mongoose.model<ISpecialty>('Specialty', SpecialtySchema);
