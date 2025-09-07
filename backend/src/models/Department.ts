import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code?: string;
  isActive: boolean;
  program: mongoose.Types.ObjectId; // single program
}

const DepartmentSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String },
  isActive: { type: Boolean, default: true },
  program: { type: Schema.Types.ObjectId, ref: 'Program', required: true }
}, { timestamps: true });

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
