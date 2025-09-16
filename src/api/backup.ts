import fetchClient, { handleFetchError, apiBase } from '../lib/fetchClient';
import { BackupJob, RestoreJob, BackupSettings, SystemHealth } from '../types/backup';

const BASE = '/api/backup';

// Backup Operations
export async function getBackupJobs(): Promise<{ data: BackupJob[] }> {
  const res = await fetchClient.get(`${BASE}/jobs`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createBackup(payload: {
  type: 'full' | 'database' | 'files' | 'incremental';
  metadata?: {
    collections?: string[];
    fileTypes?: string[];
    compression?: boolean;
    encryption?: boolean;
  };
}): Promise<{ data: BackupJob }> {
  const res = await fetchClient.postJson(`${BASE}/create`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function cancelBackup(jobId: string): Promise<{ message: string }> {
  const res = await fetchClient.postJson(`${BASE}/jobs/${jobId}/cancel`, {});
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function downloadBackup(jobId: string): Promise<Blob> {
  const res = await fetchClient.get(`${BASE}/jobs/${jobId}/download`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.blob();
}

export async function deleteBackup(jobId: string): Promise<{ message: string }> {
  const res = await fetchClient.delete(`${BASE}/jobs/${jobId}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Restore Operations
export async function getRestoreJobs(): Promise<{ data: RestoreJob[] }> {
  const res = await fetchClient.get(`${BASE}/restore/jobs`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createRestore(payload: {
  backupId: string;
  options: {
    overwriteExisting: boolean;
    restoreFiles: boolean;
    restoreDatabase: boolean;
    selectedCollections?: string[];
  };
}): Promise<{ data: RestoreJob }> {
  const res = await fetchClient.postJson(`${BASE}/restore`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function uploadBackupFile(file: File): Promise<{ data: { backupId: string; fileName: string } }> {
  const formData = new FormData();
  formData.append('backup', file);
  
  const token = fetchClient.getAuthToken();
  const base = apiBase().replace(/\/$/, '');
  const response = await fetch(`${base}${BASE}/upload`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload backup file');
  }
  
  return response.json();
}

// Settings
export async function getBackupSettings(): Promise<{ data: BackupSettings }> {
  const res = await fetchClient.get(`${BASE}/settings`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function updateBackupSettings(payload: Partial<BackupSettings>): Promise<{ data: BackupSettings }> {
  const res = await fetchClient.put(`${BASE}/settings`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// System Health
export async function getSystemHealth(): Promise<{ data: SystemHealth }> {
  const res = await fetchClient.get(`${BASE}/health`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Utilities
export async function validateBackupFile(file: File): Promise<{ data: { valid: boolean; metadata?: any; error?: string } }> {
  const formData = new FormData();
  formData.append('backup', file);
  
  const token = fetchClient.getAuthToken();
  const base = apiBase().replace(/\/$/, '');
  const response = await fetch(`${base}${BASE}/validate`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  
  if (!response.ok) {
    await handleFetchError(response);
  }
  
  return response.json();
}

export async function getBackupSchedule(): Promise<{ data: { nextRun?: string; lastRun?: string; enabled: boolean } }> {
  const res = await fetchClient.get(`${BASE}/schedule`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}