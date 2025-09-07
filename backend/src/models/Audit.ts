import mongoose, { Schema, Document } from 'mongoose';

export interface IAudit extends Document {
  user: mongoose.Types.ObjectId; // User who performed the action
  action: string; // e.g., 'createUser', 'updateUser', 'deleteUser'
  entity: string; // e.g., 'User', 'Branch'
  entityId: mongoose.Types.ObjectId; // ID of the affected entity
  changes?: {
    before: any;
    after: any;
  };
  timestamp: Date;
  branch?: mongoose.Types.ObjectId; // Branch where the action occurred
  ipAddress?: string;
  details?: string; // Additional details
}

const AuditSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  changes: {
    before: { type: Object },
    after: { type: Object }
  },
  timestamp: { type: Date, default: Date.now, index: true },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
  ipAddress: { type: String },
  details: { type: String }
});

AuditSchema.index({ user: 1 });
AuditSchema.index({ entity: 1, entityId: 1 });

export default mongoose.model<IAudit>('Audit', AuditSchema);
