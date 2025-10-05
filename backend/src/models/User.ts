import mongoose, { Schema, Document } from 'mongoose';
import { getTemplateForRole, RoleType } from '../lib/rolePermissions';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  type: 'SuperAdmin' | 'Admin' | 'Registrar' | 'Lecturer' | 'Accountant' | 'Dean of Studies' | 'Head Of Department';
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
    enum: ['SuperAdmin', 'Admin', 'Registrar', 'Lecturer', 'Accountant', 'Dean of Studies', 'Head Of Department']
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

// Auto-assign default permissions only when a new user is created AND
// no explicit permissions object was provided. This prevents later saves
// with an intentionally reduced permission set from being re-expanded.
UserSchema.pre('save', function(next) {
  try {
    const doc = this as any;
    const isNew: boolean = doc.isNew;
    const hasExplicitPermissions = doc.isModified('permissions') && doc.permissions && Object.keys(doc.permissions).length > 0;
    if (isNew && !hasExplicitPermissions) {
      if (!doc.permissions || Object.keys(doc.permissions || {}).length === 0) {
        if (doc.type) {
          doc.permissions = getTemplateForRole(doc.type as RoleType);
        }
      }
    }
  } catch (e) {
    // swallow to avoid blocking save
  }
  next();
});

// Index for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ type: 1 });
UserSchema.index({ branch: 1 });
UserSchema.index({ createdBy: 1 });
UserSchema.index({ isActive: 1 });

export default mongoose.model<IUser>('User', UserSchema);
