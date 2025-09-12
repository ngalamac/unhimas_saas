import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffMember extends Document {
  firstName: string;
  lastName: string;
  names: string;
  email: string;
  phoneNumber: string;
  employeeId: string;
  department: string;
  position: string;
  type: 'Lecturer' | 'Accountant' | 'Dean of Studies' | 'Head Of Department' | 'Admin';
  isActive: boolean;
  hireDate: Date;
  hourlyRate: number; // Pay per hour in XAF
  baseSalary?: number; // Fixed monthly salary for non-hourly staff
  paymentType: 'hourly' | 'fixed'; // How they are paid
  branch: mongoose.Types.ObjectId;
  profilePicture?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaffMemberSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  names: { type: String },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Lecturer', 'Accountant', 'Dean of Studies', 'Head Of Department', 'Admin'],
    required: true 
  },
  isActive: { type: Boolean, default: true },
  hireDate: { type: Date, required: true },
  hourlyRate: { type: Number, required: true, min: 0 },
  baseSalary: { type: Number, min: 0 },
  paymentType: { 
    type: String, 
    enum: ['hourly', 'fixed'], 
    required: true,
    default: 'hourly'
  },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  profilePicture: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    region: { type: String },
    country: { type: String, default: 'Cameroon' }
  },
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String }
  },
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    accountName: { type: String }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Generate names field before saving
StaffMemberSchema.pre<IStaffMember>('save', function(next) {
  this.names = `${this.firstName} ${this.lastName}`;
  next();
});

// Indexes for efficient queries
StaffMemberSchema.index({ employeeId: 1 });
StaffMemberSchema.index({ email: 1 });
StaffMemberSchema.index({ branch: 1 });
StaffMemberSchema.index({ type: 1 });
StaffMemberSchema.index({ isActive: 1 });
StaffMemberSchema.index({ department: 1 });

export default mongoose.model<IStaffMember>('StaffMember', StaffMemberSchema);