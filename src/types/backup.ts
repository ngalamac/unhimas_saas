export interface BackupJob {
  _id: string;
  type: 'full' | 'database' | 'files' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: string;
  endTime?: string;
  fileSize?: number;
  fileName?: string;
  downloadUrl?: string;
  errorMessage?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  metadata: {
    collections?: string[];
    fileTypes?: string[];
    compression?: boolean;
    encryption?: boolean;
    retentionDays?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RestoreJob {
  _id: string;
  backupId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: string;
  endTime?: string;
  errorMessage?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  options: {
    overwriteExisting: boolean;
    restoreFiles: boolean;
    restoreDatabase: boolean;
    selectedCollections?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface BackupSettings {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    size: number;
    collections: number;
    lastBackup?: string;
  };
  files: {
    status: 'healthy' | 'warning' | 'critical';
    totalSize: number;
    fileCount: number;
    lastBackup?: string;
  };
  storage: {
    available: number;
    used: number;
    percentage: number;
  };
  performance: {
    responseTime: number;
    uptime: number;
    memoryUsage: number;
  };
}