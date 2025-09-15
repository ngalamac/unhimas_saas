import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  HardDrive,
  Calendar,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useUI } from '../../../context/UIContext';
import { formatXAF } from '../../../utils/currency';
import {
  getBackupJobs,
  createBackup,
  cancelBackup,
  downloadBackup,
  deleteBackup,
  getRestoreJobs,
  createRestore,
  uploadBackupFile,
  validateBackupFile,
  getBackupSettings,
  updateBackupSettings,
  getSystemHealth,
  getBackupSchedule
} from '../../../api/backup';
import { BackupJob, RestoreJob, BackupSettings, SystemHealth } from '../../../types/backup';
import useSSE from '../../../lib/useSSE';

const BackupManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();
  
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'backups' | 'restore' | 'settings' | 'health'>('backups');
  
  // Backup creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [backupType, setBackupType] = useState<'full' | 'database' | 'files' | 'incremental'>('full');
  const [backupOptions, setBackupOptions] = useState({
    compression: true,
    encryption: false,
    collections: [] as string[],
    fileTypes: [] as string[]
  });
  
  // Restore state
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupJob | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    overwriteExisting: false,
    restoreFiles: true,
    restoreDatabase: true,
    selectedCollections: [] as string[]
  });
  
  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<BackupSettings>>({});

  useEffect(() => {
    fetchAllData();
  }, []);

  // Real-time updates via SSE with backend base
  useSSE('/api/events', {
    'backup.started': () => fetchBackupJobs(),
    'backup.progress': () => fetchBackupJobs(),
    'backup.completed': () => fetchBackupJobs(),
    'backup.failed': () => fetchBackupJobs(),
    'restore.started': () => fetchRestoreJobs(),
    'restore.completed': () => fetchRestoreJobs(),
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBackupJobs(),
        fetchRestoreJobs(),
        fetchSettings(),
        fetchSystemHealth()
      ]);
    } catch (error) {
      console.error('Failed to fetch backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupJobs = async () => {
    try {
      const response = await getBackupJobs();
      setBackupJobs(response.data);
    } catch (error: any) {
      showToast('Failed to load backup jobs', 'error');
    }
  };

  const fetchRestoreJobs = async () => {
    try {
      const response = await getRestoreJobs();
      setRestoreJobs(response.data);
    } catch (error: any) {
      showToast('Failed to load restore jobs', 'error');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await getBackupSettings();
      setSettings(response.data);
      setSettingsForm(response.data);
    } catch (error: any) {
      console.error('Failed to load backup settings:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await getSystemHealth();
      setSystemHealth(response.data);
    } catch (error: any) {
      console.error('Failed to load system health:', error);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup({
        type: backupType,
        metadata: backupOptions
      });
      
      setShowCreateModal(false);
      showToast('Backup job created successfully', 'success');
      fetchBackupJobs();
    } catch (error: any) {
      showToast(error.message || 'Failed to create backup', 'error');
    }
  };

  const handleCancelBackup = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this backup?')) return;
    
    try {
      await cancelBackup(jobId);
      showToast('Backup cancelled successfully', 'success');
      fetchBackupJobs();
    } catch (error: any) {
      showToast(error.message || 'Failed to cancel backup', 'error');
    }
  };

  const handleDownloadBackup = async (job: BackupJob) => {
    try {
      const blob = await downloadBackup(job._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = job.fileName || `backup-${job._id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Backup download started', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to download backup', 'error');
    }
  };

  const handleDeleteBackup = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) return;
    
    try {
      await deleteBackup(jobId);
      showToast('Backup deleted successfully', 'success');
      fetchBackupJobs();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete backup', 'error');
    }
  };

  const handleUploadBackup = async () => {
    if (!uploadFile) {
      showToast('Please select a backup file', 'error');
      return;
    }

    try {
      setUploading(true);
      
      // Validate file first
      const validation = await validateBackupFile(uploadFile);
      if (!validation.data.valid) {
        showToast(validation.data.error || 'Invalid backup file', 'error');
        return;
      }

      // Upload file
      await uploadBackupFile(uploadFile);
      
      setShowUploadModal(false);
      setUploadFile(null);
      showToast('Backup file uploaded successfully', 'success');
      fetchBackupJobs();
    } catch (error: any) {
      showToast(error.message || 'Failed to upload backup file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateRestore = async () => {
    if (!selectedBackup) return;
    
    try {
      await createRestore({
        backupId: selectedBackup._id,
        options: restoreOptions
      });
      
      setShowRestoreModal(false);
      setSelectedBackup(null);
      showToast('Restore job created successfully', 'success');
      fetchRestoreJobs();
    } catch (error: any) {
      showToast(error.message || 'Failed to create restore job', 'error');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await updateBackupSettings(settingsForm);
      setShowSettingsModal(false);
      showToast('Backup settings updated successfully', 'success');
      fetchSettings();
    } catch (error: any) {
      showToast(error.message || 'Failed to update settings', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running': return <Play className="w-4 h-4 text-blue-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <Pause className="w-4 h-4 text-gray-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backup & Restore</h1>
          <p className="text-gray-600 mt-1">Manage system backups and data restoration</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Backup</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Create Backup</span>
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className="text-lg font-bold text-gray-900">{formatFileSize(systemHealth.database.size)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getHealthIcon(systemHealth.database.status)}
                  <span className="text-xs text-gray-500">{systemHealth.database.collections} collections</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Files</p>
                <p className="text-lg font-bold text-gray-900">{formatFileSize(systemHealth.files.totalSize)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getHealthIcon(systemHealth.files.status)}
                  <span className="text-xs text-gray-500">{systemHealth.files.fileCount} files</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Storage</p>
                <p className="text-lg font-bold text-gray-900">{systemHealth.storage.percentage}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      systemHealth.storage.percentage > 80 ? 'bg-red-500' : 
                      systemHealth.storage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${systemHealth.storage.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Performance</p>
                <p className="text-lg font-bold text-gray-900">{systemHealth.performance.responseTime}ms</p>
                <div className="text-xs text-gray-500 mt-1">
                  Uptime: {Math.floor(systemHealth.performance.uptime / 3600)}h
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'backups', name: 'Backup Jobs', icon: <Database className="w-4 h-4" /> },
              { id: 'restore', name: 'Restore Jobs', icon: <RefreshCw className="w-4 h-4" /> },
              { id: 'settings', name: 'Settings', icon: <Settings className="w-4 h-4" /> },
              { id: 'health', name: 'System Health', icon: <Shield className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Backup Jobs Tab */}
          {activeTab === 'backups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Backup Jobs</h3>
                <button
                  onClick={fetchBackupJobs}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backupJobs.map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Database className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 capitalize">{job.type} Backup</div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                                  {getStatusIcon(job.status)}
                                  <span className="ml-1 capitalize">{job.status}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                job.status === 'completed' ? 'bg-green-500' :
                                job.status === 'failed' ? 'bg-red-500' :
                                job.status === 'running' ? 'bg-blue-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{job.progress}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(job.startTime, job.endTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.fileSize ? formatFileSize(job.fileSize) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.createdBy.name}</div>
                          <div className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {job.status === 'completed' && (
                              <>
                                <button
                                  onClick={() => handleDownloadBackup(job)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Download Backup"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedBackup(job);
                                    setShowRestoreModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Restore from Backup"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(job.status === 'pending' || job.status === 'running') && (
                              <button
                                onClick={() => handleCancelBackup(job._id)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Cancel Backup"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBackup(job._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Backup"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {backupJobs.length === 0 && (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No backup jobs</h3>
                  <p className="text-sm text-gray-500">Create your first backup to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Restore Jobs Tab */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Restore Jobs</h3>
                <button
                  onClick={fetchRestoreJobs}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Backup Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status & Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Options
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restoreJobs.map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <RefreshCw className="w-5 h-5 text-green-600" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {typeof job.backupId === 'string' ? job.backupId : (job.backupId as any).fileName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {typeof job.backupId === 'string' ? 'Backup' : `${(job.backupId as any).type} backup`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                              {getStatusIcon(job.status)}
                              <span className="ml-1 capitalize">{job.status}</span>
                            </span>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className={`h-1 rounded-full ${
                                  job.status === 'completed' ? 'bg-green-500' :
                                  job.status === 'failed' ? 'bg-red-500' :
                                  job.status === 'running' ? 'bg-blue-500' : 'bg-gray-400'
                                }`}
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-600">
                            <div>Database: {job.options.restoreDatabase ? 'Yes' : 'No'}</div>
                            <div>Files: {job.options.restoreFiles ? 'Yes' : 'No'}</div>
                            <div>Overwrite: {job.options.overwriteExisting ? 'Yes' : 'No'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(job.startTime, job.endTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.createdBy.name}</div>
                          <div className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {restoreJobs.length === 0 && (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No restore jobs</h3>
                  <p className="text-sm text-gray-500">No restoration operations have been performed.</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Backup Configuration</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Automatic Backups</label>
                    <input
                      type="checkbox"
                      checked={settings.autoBackupEnabled}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, autoBackupEnabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period (Days)</label>
                    <input
                      type="number"
                      value={settings.retentionDays}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="365"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Compression</label>
                    <input
                      type="checkbox"
                      checked={settings.compressionEnabled}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, compressionEnabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Encryption</label>
                    <input
                      type="checkbox"
                      checked={settings.encryptionEnabled}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, encryptionEnabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Backup Size (MB)</label>
                    <input
                      type="number"
                      value={settings.maxBackupSize}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, maxBackupSize: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Schedule (Cron)</label>
                    <input
                      type="text"
                      value={settings.autoBackupSchedule}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, autoBackupSchedule: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0 2 * * *"
                    />
                    <p className="text-xs text-gray-500 mt-1">Daily at 2:00 AM</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateSettings}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && systemHealth && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">System Health Monitor</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Database Health</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <div className="flex items-center space-x-2">
                        {getHealthIcon(systemHealth.database.status)}
                        <span className="text-sm font-medium capitalize">{systemHealth.database.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Size</span>
                      <span className="text-sm font-medium">{formatFileSize(systemHealth.database.size)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Collections</span>
                      <span className="text-sm font-medium">{systemHealth.database.collections}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Backup</span>
                      <span className="text-sm font-medium">
                        {systemHealth.database.lastBackup 
                          ? new Date(systemHealth.database.lastBackup).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Storage Health</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Used Space</span>
                      <span className="text-sm font-medium">{formatFileSize(systemHealth.storage.used)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Available Space</span>
                      <span className="text-sm font-medium">{formatFileSize(systemHealth.storage.available)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Usage Percentage</span>
                      <span className={`text-sm font-medium ${
                        systemHealth.storage.percentage > 80 ? 'text-red-600' :
                        systemHealth.storage.percentage > 60 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {systemHealth.storage.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          systemHealth.storage.percentage > 80 ? 'bg-red-500' :
                          systemHealth.storage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemHealth.storage.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create System Backup</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Backup Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'full', name: 'Full Backup', desc: 'Complete system backup', icon: <Database className="w-5 h-5" /> },
                    { id: 'database', name: 'Database Only', desc: 'Database collections only', icon: <FileText className="w-5 h-5" /> },
                    { id: 'files', name: 'Files Only', desc: 'Uploaded files only', icon: <Upload className="w-5 h-5" /> },
                    { id: 'incremental', name: 'Incremental', desc: 'Changes since last backup', icon: <Clock className="w-5 h-5" /> }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBackupType(type.id as any)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        backupType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          backupType === type.id ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {type.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{type.name}</div>
                          <div className="text-xs text-gray-600">{type.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Compression</label>
                  <input
                    type="checkbox"
                    checked={backupOptions.compression}
                    onChange={(e) => setBackupOptions(prev => ({ ...prev, compression: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Encryption</label>
                  <input
                    type="checkbox"
                    checked={backupOptions.encryption}
                    onChange={(e) => setBackupOptions(prev => ({ ...prev, encryption: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBackup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Backup Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Backup File</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Backup File</label>
                <input
                  type="file"
                  accept=".zip,.tar.gz,.bak"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: .zip, .tar.gz, .bak
                </p>
              </div>
              
              {uploadFile && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{uploadFile.name}</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Size: {formatFileSize(uploadFile.size)}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadBackup}
                disabled={!uploadFile || uploading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Restore from Backup</h3>
              <p className="text-sm text-gray-600 mt-1">
                Restoring from: {selectedBackup.fileName}
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Warning</h4>
                    <p className="text-sm text-red-700 mt-1">
                      This operation will modify your system data. Make sure you have a recent backup before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Restore Database</label>
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreDatabase}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreDatabase: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Restore Files</label>
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreFiles}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreFiles: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Overwrite Existing Data</label>
                  <input
                    type="checkbox"
                    checked={restoreOptions.overwriteExisting}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedBackup(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRestore}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Start Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManagementPage;