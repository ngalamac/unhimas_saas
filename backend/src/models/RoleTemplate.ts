import mongoose, { Schema, Document } from 'mongoose';
import { RoleType } from '../lib/rolePermissions';
import { PermissionMap } from '../types/permissions';

export interface IRoleTemplate extends Document {
  role: RoleType;
  permissions: PermissionMap;
  isDefault: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const RoleTemplateSchema: Schema = new Schema<IRoleTemplate>({
  role: { type: String, required: true, enum: ['SuperAdmin', 'Admin', 'Registrar', 'Lecturer', 'Accountant', 'Dean of Studies', 'Head Of Department'], unique: true },
  permissions: { type: Schema.Types.Mixed, required: true, default: {} },
  isDefault: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IRoleTemplate>('RoleTemplate', RoleTemplateSchema);
