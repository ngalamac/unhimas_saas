import mongoose, { Schema, Document } from 'mongoose';

export interface IBackupJob extends Document {
  type: 'full' | 'database' | 'files' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: Date;
  endTime?: Date;
  fileSize?: number;
  fileName?: string;
  filePath?: string;
  downloadUrl?: string;
  errorMessage?: string;
  createdBy: mongoose.Types.ObjectId;
  metadata: {
    collections?: string[];
    fileTypes?: string[];
    compression?: boolean;
    encryption?: boolean;
    retentionDays?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BackupJobSchema: Schema = new Schema({
  type: { 
    type: String, 
    enum: ['full', 'database', 'files', 'incremental'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  fileSize: { type: Number },
  fileName: { type: String },
  filePath: { type: String },
  downloadUrl: { type: String },
  errorMessage: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  metadata: {
    collections: [{ type: String }],
    fileTypes: [{ type: String }],
    compression: { type: Boolean, default: true },
    encryption: { type: Boolean, default: false },
    retentionDays: { type: Number, default: 30 }
  }
}, { timestamps: true });

// Indexes for efficient queries
BackupJobSchema.index({ status: 1 });
BackupJobSchema.index({ type: 1 });
BackupJobSchema.index({ createdBy: 1 });
BackupJobSchema.index({ createdAt: -1 });

export default mongoose.model<IBackupJob>('BackupJob', BackupJobSchema);