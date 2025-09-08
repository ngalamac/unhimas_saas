import express, { Request } from 'express';
import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';
import stream from 'stream';

const router = express.Router();

// Use memory storage for multer and stream into MongoDB GridFSBucket so files are stored in DB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Single file upload for profile images -> store in GridFS
router.post('/profile', upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res) => {
  console.log('[upload] Received request for /profile. Body:', req.body, 'File:', req.file);
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const ext = path.extname(req.file.originalname) || '.png';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    const uploadStream = bucket.openUploadStream(filename, { contentType: req.file.mimetype, metadata: { originalname: req.file.originalname } });
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    bufferStream.pipe(uploadStream);
    uploadStream.on('error', (err: any) => {
      return res.status(500).json({ message: 'Upload error', error: err?.message });
    });
    uploadStream.on('finish', () => {
      const id = uploadStream.id.toString();
      // return relative URL; frontend will resolve to correct origin in development or production
      const relative = `/api/uploads/file/${id}`;
      return res.json({ id, url: relative });
    });
  } catch (e: any) {
    return res.status(500).json({ message: 'Upload error', error: e?.message });
  }
});

// Stream a file from GridFS by id
router.get('/file/:id', async (req: Request, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const filesColl = db.collection('uploads.files');
    const id = new mongoose.Types.ObjectId(req.params.id);
    const fileDoc = await filesColl.findOne({ _id: id });
    if (!fileDoc) return res.status(404).json({ message: 'Not found' });
    if (fileDoc.contentType) res.setHeader('Content-Type', fileDoc.contentType);
    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.on('error', () => res.status(500).end());
    downloadStream.pipe(res);
  } catch (e: any) {
    return res.status(400).json({ message: 'Invalid file id', error: e?.message });
  }
});

// multer / generic error handler
router.use((err: any, _req: any, res: any, _next: any) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Max size is 5MB.' });
  }
  return res.status(500).json({ message: 'Upload error', error: err?.message });
});

export default router;
