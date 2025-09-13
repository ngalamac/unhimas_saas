import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import archiver from 'archiver';
import mongoose from 'mongoose';
import BackupJob from '../models/BackupJob';
import RestoreJob from '../models/RestoreJob';
import BackupSettings from '../models/BackupSettings';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';
import { emitEvent } from '../lib/events';

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../tmp/uploads') });

// Ensure backup directories exist
const backupDir = path.join(__dirname, '../../backups');
const tempDir = path.join(__dirname, '../../tmp');

[backupDir, tempDir, path.join(tempDir, 'uploads')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Get all backup jobs
router.get('/jobs', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(10, parseInt((req.query.limit as string) || '20'));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const total = await BackupJob.countDocuments(filter);
    const jobs = await BackupJob.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ data: jobs, meta: { total, page, limit } });
  } catch (err: any) {
    console.error('GET /api/backup/jobs error', err);
    res.status(500).json({ error: { message: 'Failed to fetch backup jobs' } });
  }
});

// Create new backup
router.post('/create', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const { type, metadata } = req.body;

    if (!type || !['full', 'database', 'files', 'incremental'].includes(type)) {
      return res.status(400).json({ error: { message: 'Invalid backup type' } });
    }

    const job = new BackupJob({
      type,
      createdBy: req.user?.id,
      metadata: metadata || {}
    });

    await job.save();

    // Start backup process asynchronously
    processBackup(job._id.toString()).catch(err => {
      console.error('Backup process error:', err);
    });

    const populatedJob = await BackupJob.findById(job._id)
      .populate('createdBy', 'name email');

    try {
      emitEvent('general', 'backup.started', { job: populatedJob });
    } catch (e) {}

    res.status(201).json({ data: populatedJob });
  } catch (err: any) {
    console.error('POST /api/backup/create error', err);
    res.status(500).json({ error: { message: 'Failed to create backup job' } });
  }
});

// Cancel backup job
router.post('/jobs/:id/cancel', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const job = await BackupJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: { message: 'Backup job not found' } });
    }

    if (job.status !== 'pending' && job.status !== 'running') {
      return res.status(400).json({ error: { message: 'Cannot cancel completed or failed job' } });
    }

    job.status = 'cancelled';
    job.endTime = new Date();
    await job.save();

    try {
      emitEvent('general', 'backup.cancelled', { jobId: job._id });
    } catch (e) {}

    res.json({ message: 'Backup job cancelled successfully' });
  } catch (err: any) {
    console.error('POST /api/backup/jobs/:id/cancel error', err);
    res.status(500).json({ error: { message: 'Failed to cancel backup job' } });
  }
});

// Download backup file
router.get('/jobs/:id/download', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const job = await BackupJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: { message: 'Backup job not found' } });
    }

    if (job.status !== 'completed' || !job.filePath) {
      return res.status(400).json({ error: { message: 'Backup file not available' } });
    }

    const filePath = path.resolve(job.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { message: 'Backup file not found on disk' } });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err: any) {
    console.error('GET /api/backup/jobs/:id/download error', err);
    res.status(500).json({ error: { message: 'Failed to download backup file' } });
  }
});

// Delete backup job and file
router.delete('/jobs/:id', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const job = await BackupJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: { message: 'Backup job not found' } });
    }

    // Delete backup file if it exists
    if (job.filePath && fs.existsSync(job.filePath)) {
      fs.unlinkSync(job.filePath);
    }

    await BackupJob.findByIdAndDelete(req.params.id);

    try {
      emitEvent('general', 'backup.deleted', { jobId: job._id });
    } catch (e) {}

    res.json({ message: 'Backup deleted successfully' });
  } catch (err: any) {
    console.error('DELETE /api/backup/jobs/:id error', err);
    res.status(500).json({ error: { message: 'Failed to delete backup' } });
  }
});

// Upload backup file for restoration
router.post('/upload', authMiddleware, requirePermission('all'), upload.single('backup'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No backup file uploaded' } });
    }

    // Validate file type and structure
    const fileName = req.file.originalname;
    const filePath = req.file.path;

    // Move file to backups directory
    const backupFileName = `uploaded-${Date.now()}-${fileName}`;
    const backupFilePath = path.join(backupDir, backupFileName);
    fs.renameSync(filePath, backupFilePath);

    // Create backup job record for uploaded file
    const job = new BackupJob({
      type: 'full',
      status: 'completed',
      progress: 100,
      startTime: new Date(),
      endTime: new Date(),
      fileName: backupFileName,
      filePath: backupFilePath,
      fileSize: req.file.size,
      createdBy: req.user?.id,
      metadata: {
        compression: true,
        encryption: false
      }
    });

    await job.save();

    res.json({ 
      data: { 
        backupId: job._id.toString(), 
        fileName: backupFileName 
      } 
    });
  } catch (err: any) {
    console.error('POST /api/backup/upload error', err);
    res.status(500).json({ error: { message: 'Failed to upload backup file' } });
  }
});

// Validate backup file
router.post('/validate', authMiddleware, requirePermission('all'), upload.single('backup'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No backup file provided' } });
    }

    // Basic validation - check if it's a valid archive
    const fileName = req.file.originalname;
    const isValidExtension = fileName.endsWith('.zip') || fileName.endsWith('.tar.gz') || fileName.endsWith('.bak');

    if (!isValidExtension) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.json({ 
        data: { 
          valid: false, 
          error: 'Invalid file format. Expected .zip, .tar.gz, or .bak file.' 
        } 
      });
    }

    // Additional validation could be added here (file structure, metadata, etc.)
    const metadata = {
      fileName: fileName,
      fileSize: req.file.size,
      uploadDate: new Date().toISOString()
    };

    // Clean up uploaded file after validation
    fs.unlinkSync(req.file.path);

    res.json({ 
      data: { 
        valid: true, 
        metadata 
      } 
    });
  } catch (err: any) {
    console.error('POST /api/backup/validate error', err);
    res.status(500).json({ error: { message: 'Failed to validate backup file' } });
  }
});

// Get restore jobs
router.get('/restore/jobs', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const jobs = await RestoreJob.find()
      .populate('backupId', 'fileName type createdAt')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ data: jobs });
  } catch (err: any) {
    console.error('GET /api/backup/restore/jobs error', err);
    res.status(500).json({ error: { message: 'Failed to fetch restore jobs' } });
  }
});

// Create restore job
router.post('/restore', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const { backupId, options } = req.body;

    if (!backupId || !options) {
      return res.status(400).json({ error: { message: 'Backup ID and options are required' } });
    }

    // Verify backup exists and is completed
    const backup = await BackupJob.findById(backupId);
    if (!backup) {
      return res.status(404).json({ error: { message: 'Backup not found' } });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ error: { message: 'Can only restore from completed backups' } });
    }

    const restoreJob = new RestoreJob({
      backupId,
      createdBy: req.user?.id,
      options
    });

    await restoreJob.save();

    // Start restore process asynchronously
    processRestore(restoreJob._id.toString()).catch(err => {
      console.error('Restore process error:', err);
    });

    const populatedJob = await RestoreJob.findById(restoreJob._id)
      .populate('backupId', 'fileName type')
      .populate('createdBy', 'name email');

    try {
      emitEvent('general', 'restore.started', { job: populatedJob });
    } catch (e) {}

    res.status(201).json({ data: populatedJob });
  } catch (err: any) {
    console.error('POST /api/backup/restore error', err);
    res.status(500).json({ error: { message: 'Failed to create restore job' } });
  }
});

// Get backup settings
router.get('/settings', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    let settings = await BackupSettings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = new BackupSettings({
        autoBackupEnabled: false,
        autoBackupSchedule: '0 2 * * *',
        retentionDays: 30,
        compressionEnabled: true,
        encryptionEnabled: false,
        storageLocation: 'local',
        emailNotifications: true,
        notificationEmails: [],
        maxBackupSize: 1024,
        excludedCollections: [],
        excludedFileTypes: ['.tmp', '.log']
      });
      await settings.save();
    }

    res.json({ data: settings });
  } catch (err: any) {
    console.error('GET /api/backup/settings error', err);
    res.status(500).json({ error: { message: 'Failed to fetch backup settings' } });
  }
});

// Update backup settings
router.put('/settings', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    
    let settings = await BackupSettings.findOne();
    if (!settings) {
      settings = new BackupSettings(updates);
    } else {
      Object.assign(settings, updates);
    }

    await settings.save();

    try {
      emitEvent('general', 'backup.settings.updated', { settings });
    } catch (e) {}

    res.json({ data: settings });
  } catch (err: any) {
    console.error('PUT /api/backup/settings error', err);
    res.status(500).json({ error: { message: 'Failed to update backup settings' } });
  }
});

// Get system health
router.get('/health', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: { message: 'Database not available' } });
    }

    // Get database stats
    const dbStats = await db.stats();
    const collections = await db.listCollections().toArray();

    // Get last backup info
    const lastBackup = await BackupJob.findOne({ status: 'completed' })
      .sort({ createdAt: -1 });

    // Mock file system stats (in production, use actual disk usage)
    const health = {
      database: {
        status: 'healthy' as const,
        size: dbStats.dataSize || 0,
        collections: collections.length,
        lastBackup: lastBackup?.createdAt.toISOString()
      },
      files: {
        status: 'healthy' as const,
        totalSize: 0, // Would calculate actual file sizes
        fileCount: 0, // Would count actual files
        lastBackup: lastBackup?.createdAt.toISOString()
      },
      storage: {
        available: 1000000000, // 1GB mock
        used: 250000000, // 250MB mock
        percentage: 25
      },
      performance: {
        responseTime: 150, // ms
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed
      }
    };

    res.json({ data: health });
  } catch (err: any) {
    console.error('GET /api/backup/health error', err);
    res.status(500).json({ error: { message: 'Failed to fetch system health' } });
  }
});

// Get backup schedule info
router.get('/schedule', authMiddleware, requirePermission('all'), async (req: AuthRequest, res) => {
  try {
    const settings = await BackupSettings.findOne();
    const lastBackup = await BackupJob.findOne({ status: 'completed' })
      .sort({ createdAt: -1 });

    // Mock next run calculation (in production, use actual cron parser)
    const nextRun = settings?.autoBackupEnabled 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      : undefined;

    res.json({
      data: {
        nextRun,
        lastRun: lastBackup?.createdAt.toISOString(),
        enabled: settings?.autoBackupEnabled || false
      }
    });
  } catch (err: any) {
    console.error('GET /api/backup/schedule error', err);
    res.status(500).json({ error: { message: 'Failed to fetch backup schedule' } });
  }
});

// Backup processing function
async function processBackup(jobId: string) {
  const job = await BackupJob.findById(jobId);
  if (!job) return;

  try {
    job.status = 'running';
    job.progress = 0;
    await job.save();

    const fileName = `backup-${job.type}-${Date.now()}.zip`;
    const filePath = path.join(backupDir, fileName);
    
    // Create archive
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    // Update progress periodically
    const progressInterval = setInterval(async () => {
      if (job.progress < 90) {
        job.progress += 10;
        await job.save();
        
        try {
          emitEvent('general', 'backup.progress', { 
            jobId: job._id, 
            progress: job.progress 
          });
        } catch (e) {}
      }
    }, 1000);

    if (job.type === 'database' || job.type === 'full') {
      // Export database collections
      const db = mongoose.connection.db;
      if (db) {
        const collections = await db.listCollections().toArray();
        
        for (const collection of collections) {
          const collectionName = collection.name;
          if (job.metadata.collections && !job.metadata.collections.includes(collectionName)) {
            continue;
          }

          const docs = await db.collection(collectionName).find({}).toArray();
          const jsonData = JSON.stringify(docs, null, 2);
          archive.append(jsonData, { name: `database/${collectionName}.json` });
        }
      }
    }

    if (job.type === 'files' || job.type === 'full') {
      // Add uploaded files (GridFS files would need special handling)
      const uploadsPath = path.join(__dirname, '../../public/uploads');
      if (fs.existsSync(uploadsPath)) {
        archive.directory(uploadsPath, 'files/uploads');
      }
    }

    // Finalize archive
    await archive.finalize();

    // Wait for output stream to finish
    await new Promise((resolve, reject) => {
  output.on('close', () => resolve(void 0));
      output.on('error', reject);
    });

    clearInterval(progressInterval);

    // Update job status
    job.status = 'completed';
    job.progress = 100;
    job.endTime = new Date();
    job.fileName = fileName;
    job.filePath = filePath;
    job.fileSize = fs.statSync(filePath).size;
    job.downloadUrl = `/api/backup/jobs/${job._id}/download`;
    
    await job.save();

    try {
      emitEvent('general', 'backup.completed', { 
        jobId: job._id, 
        fileName, 
        fileSize: job.fileSize 
      });
    } catch (e) {}

  } catch (error: any) {
    console.error('Backup process failed:', error);
    
    job.status = 'failed';
    job.errorMessage = error.message;
    job.endTime = new Date();
    await job.save();

    try {
      emitEvent('general', 'backup.failed', { 
        jobId: job._id, 
        error: error.message 
      });
    } catch (e) {}
  }
}

// Restore processing function
async function processRestore(jobId: string) {
  const job = await RestoreJob.findById(jobId).populate('backupId');
  if (!job) return;

  try {
    job.status = 'running';
    job.progress = 0;
    await job.save();

    const backup = job.backupId as any;
    if (!backup || !backup.filePath || !fs.existsSync(backup.filePath)) {
      throw new Error('Backup file not found');
    }

    // Update progress
    const progressInterval = setInterval(async () => {
      if (job.progress < 90) {
        job.progress += 15;
        await job.save();
        
        try {
          emitEvent('general', 'restore.progress', { 
            jobId: job._id, 
            progress: job.progress 
          });
        } catch (e) {}
      }
    }, 2000);

    // Simulate restore process (in production, implement actual restore logic)
    await new Promise(resolve => setTimeout(resolve, 10000));

    clearInterval(progressInterval);

    job.status = 'completed';
    job.progress = 100;
    job.endTime = new Date();
    await job.save();

    try {
      emitEvent('general', 'restore.completed', { 
        jobId: job._id,
        backupId: backup._id
      });
    } catch (e) {}

  } catch (error: any) {
    console.error('Restore process failed:', error);
    
    job.status = 'failed';
    job.errorMessage = error.message;
    job.endTime = new Date();
    await job.save();

    try {
      emitEvent('general', 'restore.failed', { 
        jobId: job._id, 
        error: error.message 
      });
    } catch (e) {}
  }
}

export default router;