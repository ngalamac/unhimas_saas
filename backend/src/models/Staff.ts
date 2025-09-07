import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  name: string;
  role?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema: Schema = new Schema({
  name: { type: String, required: true },
  role: { type: String },
  email: { type: String },
}, { timestamps: true });

export default mongoose.model<IStaff>('Staff', StaffSchema);
