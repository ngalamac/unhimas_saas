import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmissionApplication extends Document {
  applicantName: string;
  email: string;
  phone: string;
  program: mongoose.Types.ObjectId; // Program reference
  branch: mongoose.Types.ObjectId; // Branch reference
  applicationDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  documents: string[];
  feesPaid: boolean;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const AdmissionApplicationSchema: Schema = new Schema({
  applicantName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, match: [/.+\@.+\..+/, 'Invalid email'] },
  phone: { type: String, required: true, trim: true },
  program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  applicationDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending' },
  documents: { type: [String], default: [] },
  feesPaid: { type: Boolean, default: false },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AdmissionApplicationSchema.index({ branch: 1, status: 1, applicationDate: -1 });

export default mongoose.model<IAdmissionApplication>('AdmissionApplication', AdmissionApplicationSchema);
