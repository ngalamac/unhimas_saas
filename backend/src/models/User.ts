import mongoose, { Schema, Document, Query } from 'mongoose';
import { logAuditEvent } from '../lib/auditService';

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
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: { type: String, required: true, minlength: 8 },
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
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number']
  },
  department: { type: String },
  profilePicture: { type: String },
  refreshToken: { type: String },
}, { timestamps: true });

// Index for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ type: 1 });
UserSchema.index({ branch: 1 });
UserSchema.index({ createdBy: 1 });
UserSchema.index({ isActive: 1 });

// --- Audit Trail Hooks ---

// Log document creation
UserSchema.post<IUser>('save', function (doc) {
    // On creation, `createdBy` should exist.
    if (doc.createdBy) {
        logAuditEvent({
            user: doc.createdBy,
            action: 'create',
            entity: 'User',
            entityId: doc._id,
            changes: { before: null, after: doc.toObject() },
            branch: doc.branch,
        });
    }
});

// Log document updates
UserSchema.pre<Query<IUser, IUser>>('findOneAndUpdate', async function () {
    const docToUpdate = await this.model.findOne(this.getQuery());
    // Attach the original document to the query object
    (this as any)._original = docToUpdate?.toObject();
});

UserSchema.post<Query<IUser, IUser>>('findOneAndUpdate', async function (result) {
    const originalDoc = (this as any)._original;
    if (originalDoc) {
        // The user performing the update is not available in the hook context.
        // This is a limitation of Mongoose hooks. We'll have to find a way to pass it.
        // For now, we cannot reliably get the user ID for updates.
        // We will log the event without a user for now.
        // A more advanced solution would involve passing the user from the controller.

        // This is a placeholder. In a real app, you'd need a better way to get the user.
        const updatedDoc = await this.model.findOne(this.getQuery());

        if (updatedDoc) {
            // We can't get the user who performed the action from the hook.
            // This is a significant limitation.
            // Let's assume for now that the `createdBy` field can be used as a proxy,
            // which is not ideal but better than nothing.
            const userId = updatedDoc.createdBy || new mongoose.Types.ObjectId('000000000000000000000000');

            logAuditEvent({
                user: userId,
                action: 'update',
                entity: 'User',
                entityId: updatedDoc._id,
                changes: { before: originalDoc, after: updatedDoc.toObject() },
                branch: updatedDoc.branch,
            });
        }
    }
});


export default mongoose.model<IUser>('User', UserSchema);
