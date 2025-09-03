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
  gender: 'Male' | 'Female';
  email?: string;
  program: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  profilePicture?: string; // URL or path
  level?: string | number;
  session?: string;
  tuitionStatus: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  guardian: IGuardian;
  studentId: string;
  identityHash?: string;
  branch: mongoose.Types.ObjectId; // Required - all students must belong to a branch
  admissionDate: Date;
  academicYear: string;
  isActive: boolean;
  enrollmentStatus: 'Active' | 'Suspended' | 'Graduated' | 'Withdrawn';
  createdBy: mongoose.Types.ObjectId; // User who created this student record
  lastModifiedBy?: mongoose.Types.ObjectId; // User who last modified this record
  notes?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  address?: {
    street: string;
    city: string;
    region: string;
    country: string;
    postalCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GuardianSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
  contact: { type: String }
}, { _id: false });

const EmergencyContactSchema = new Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String }
}, { _id: false });

const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String }
}, { _id: false });

const StudentSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  names: { type: String },
  dateOfBirth: { type: Date, required: true },
  placeOfBirth: { type: String, required: true },
  regionOfOrigin: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  email: { type: String },
  program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  profilePicture: { type: String },
  level: { type: Schema.Types.Mixed },
  session: { type: String },
  tuitionStatus: { 
    type: String, 
    enum: ['Paid', 'Partial', 'Pending', 'Overdue'], 
    default: 'Pending',
    required: true 
  },
  identityHash: { type: String, index: { unique: true, sparse: true } },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  guardian: { type: GuardianSchema, required: true },
  studentId: { type: String, unique: true, required: true },
  admissionDate: { type: Date, required: true, default: Date.now },
  academicYear: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  enrollmentStatus: { 
    type: String, 
    enum: ['Active', 'Suspended', 'Graduated', 'Withdrawn'], 
    default: 'Active' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  emergencyContact: { type: EmergencyContactSchema },
  address: { type: AddressSchema }
}, { timestamps: true });

// Add indexes for better query performance
StudentSchema.index({ studentId: 1 });
StudentSchema.index({ branch: 1 });
StudentSchema.index({ program: 1 });
StudentSchema.index({ department: 1 });
StudentSchema.index({ createdBy: 1 });
StudentSchema.index({ isActive: 1 });
StudentSchema.index({ enrollmentStatus: 1 });
StudentSchema.index({ tuitionStatus: 1 });
StudentSchema.index({ academicYear: 1 });
StudentSchema.index({ names: 'text', firstName: 'text', lastName: 'text' }); // Text search
StudentSchema.index({ branch: 1, isActive: 1 });
StudentSchema.index({ branch: 1, enrollmentStatus: 1 });

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
