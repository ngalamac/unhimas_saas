import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  manager: mongoose.Types.ObjectId; // User ID
  isActive: boolean;
  establishedDate: Date;
  studentCount: number;
  staffCount: number;
}

const BranchSchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  establishedDate: { type: Date, required: true },
  studentCount: { type: Number, default: 0 },
  staffCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IBranch>('Branch', BranchSchema);
