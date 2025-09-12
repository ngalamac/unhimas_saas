import mongoose, { Schema, Document } from 'mongoose';

export interface IRestoreJob extends Document {
  backupId: mongoose.Types.ObjectId;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: Date;
  endTime?: Date;
  errorMessage?: string;
  createdBy: mongoose.Types.ObjectId;
  options: {
    overwriteExisting: boolean;
    restoreFiles: boolean;
    restoreDatabase: boolean;
    selectedCollections?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const RestoreJobSchema: Schema = new Schema({
  backupId: { type: Schema.Types.ObjectId, ref: 'BackupJob', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  errorMessage: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  options: {
    overwriteExisting: { type: Boolean, default: false },
    restoreFiles: { type: Boolean, default: true },
    restoreDatabase: { type: Boolean, default: true },
    selectedCollections: [{ type: String }]
  }
}, { timestamps: true });

// Indexes for efficient queries
RestoreJobSchema.index({ status: 1 });
RestoreJobSchema.index({ backupId: 1 });
RestoreJobSchema.index({ createdBy: 1 });
RestoreJobSchema.index({ createdAt: -1 });

export default mongoose.model<IRestoreJob>('RestoreJob', RestoreJobSchema);