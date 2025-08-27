import mongoose, { Document, Schema } from 'mongoose';

export interface IGuardian {
  name: string;
  address?: string;
  contact?: string;
}

export interface IStudent extends Document {
  firstName: string;
  lastName: string;
  names: string; // full name
  dateOfBirth: Date;
  placeOfBirth: string;
  regionOfOrigin: string;
  phoneNumber: string;
  gender: string;
  email?: string;
  program: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  profilePicture?: string; // URL or path
  guardian: IGuardian;
  studentId?: string;
  identityHash?: string;
  branch?: mongoose.Types.ObjectId;
}

const GuardianSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
  contact: { type: String }
}, { _id: false });

const StudentSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  names: { type: String },
  dateOfBirth: { type: Date },
  placeOfBirth: { type: String },
  regionOfOrigin: { type: String },
  phoneNumber: { type: String },
  gender: { type: String },
  email: { type: String },
  program: { type: Schema.Types.ObjectId, ref: 'Program' },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  profilePicture: { type: String },
  identityHash: { type: String, index: { unique: true, sparse: true } },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
  guardian: { type: GuardianSchema, required: true },
  studentId: { type: String }
}, { timestamps: true });

StudentSchema.pre<IStudent>('save', function(next) {
  this.names = `${this.firstName} ${this.lastName}`;
  if (!this.studentId) {
    this.studentId = `S-${Date.now().toString().slice(-6)}`;
  }
  // compute a simple identity hash used to detect duplicates: lowercase trimmed concat of key fields
  try {
    const fn = (this.firstName || '').toString().trim().toLowerCase();
    const ln = (this.lastName || '').toString().trim().toLowerCase();
    const dob = this.dateOfBirth ? new Date(this.dateOfBirth).toISOString().slice(0,10) : '';
    const pob = (this.placeOfBirth || '').toString().trim().toLowerCase();
    this.identityHash = `${fn}|${ln}|${dob}|${pob}`;
  } catch (e) {
    // ignore hash failures
  }
  next();
});

export default mongoose.model<IStudent>('Student', StudentSchema);
