import mongoose, { Schema, Document } from 'mongoose';

export interface ISpecialty extends Document {
  name: string;
  department: mongoose.Types.ObjectId; // Reference to the Department model
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialtySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

SpecialtySchema.index({ department: 1 });

export default mongoose.model<ISpecialty>('Specialty', SpecialtySchema);
