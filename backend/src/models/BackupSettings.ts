import mongoose, { Schema, Document } from 'mongoose';

export interface IBackupSettings extends Document {
  autoBackupEnabled: boolean;
  autoBackupSchedule: string; // cron expression
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  storageLocation: 'local' | 'cloud';
  cloudSettings?: {
    provider: 'aws' | 'google' | 'azure';
    bucket: string;
    region: string;
    credentials: any;
  };
  emailNotifications: boolean;
  notificationEmails: string[];
  maxBackupSize: number; // in MB
  excludedCollections: string[];
  excludedFileTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BackupSettingsSchema: Schema = new Schema({
  autoBackupEnabled: { type: Boolean, default: false },
  autoBackupSchedule: { type: String, default: '0 2 * * *' }, // Daily at 2 AM
  retentionDays: { type: Number, default: 30, min: 1, max: 365 },
  compressionEnabled: { type: Boolean, default: true },
  encryptionEnabled: { type: Boolean, default: false },
  encryptionKey: { type: String },
  storageLocation: { type: String, enum: ['local', 'cloud'], default: 'local' },
  cloudSettings: {
    provider: { type: String, enum: ['aws', 'google', 'azure'] },
    bucket: { type: String },
    region: { type: String },
    credentials: { type: Schema.Types.Mixed }
  },
  emailNotifications: { type: Boolean, default: true },
  notificationEmails: [{ type: String }],
  maxBackupSize: { type: Number, default: 1024 }, // 1GB default
  excludedCollections: [{ type: String }],
  excludedFileTypes: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IBackupSettings>('BackupSettings', BackupSettingsSchema);