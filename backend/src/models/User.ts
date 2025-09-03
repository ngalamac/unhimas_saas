import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  type: 'SuperAdmin' | 'Admin' | 'Lecturer' | 'Accountant' | 'Dean of Studies' | 'Head Of Department';
  permissions: Record<string, Record<string, boolean>>;
  branch?: mongoose.Types.ObjectId; // Branch assignment for non-SuperAdmin users
  createdBy?: mongoose.Types.ObjectId; // Who created this user (for hierarchy tracking)
  isActive: boolean;
  lastLogin?: Date;
  employeeId?: string;
  phoneNumber?: string;
  department?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['SuperAdmin', 'Admin', 'Lecturer', 'Accountant', 'Dean of Studies', 'Head Of Department']
  },
  permissions: { type: Object, default: {} },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  employeeId: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String },
  department: { type: String },
  profilePicture: { type: String },
}, { timestamps: true });

// Index for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ type: 1 });
UserSchema.index({ branch: 1 });
UserSchema.index({ createdBy: 1 });
UserSchema.index({ isActive: 1 });

export default mongoose.model<IUser>('User', UserSchema);
