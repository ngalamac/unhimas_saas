import express, { Request } from 'express';
import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';
import stream from 'stream';
import sharp from 'sharp';

const router = express.Router();

// Use memory storage for multer and stream into MongoDB GridFSBucket so files are stored in DB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Single file upload for profile images -> store in GridFS
router.post('/profile', upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const db = mongoose.connection.db;
        if (!db) return res.status(500).json({ message: 'Database not initialized' });

        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

        // --- Upload original file ---
        const originalUploadPromise = new Promise((resolve, reject) => {
        const ext = path.extname(req.file?.originalname ?? '') || '.png';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        const uploadStream = bucket.openUploadStream(filename, {
          contentType: req.file?.mimetype ?? 'application/octet-stream',
          metadata: { originalname: req.file?.originalname ?? '', isThumbnail: false },
        });
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file?.buffer ?? Buffer.alloc(0));
            bufferStream.pipe(uploadStream)
                .on('error', (err) => reject(err))
                .on('finish', () => {
                    const id = uploadStream.id.toString();
                    const relativeUrl = `/api/uploads/file/${id}`;
                    resolve({ id, url: relativeUrl });
                });
        });

        const originalResult: any = await originalUploadPromise;

        // --- Create and upload thumbnail ---
        const thumbnailBuffer = await sharp(req.file.buffer).resize(100, 100).toBuffer();
        const thumbnailUploadPromise = new Promise((resolve, reject) => {
            const thumbFilename = `thumb-${originalResult.id}.png`;
            const uploadStream = bucket.openUploadStream(thumbFilename, {
                contentType: 'image/png',
                metadata: { originalFileId: originalResult.id, isThumbnail: true },
            });
            const bufferStream = new stream.PassThrough();
            bufferStream.end(thumbnailBuffer);
            bufferStream.pipe(uploadStream)
                .on('error', (err) => reject(err))
                .on('finish', () => {
                    const id = uploadStream.id.toString();
                    const relativeUrl = `/api/uploads/file/${id}`;
                    resolve({ id, url: relativeUrl });
                });
        });

        const thumbnailResult: any = await thumbnailUploadPromise;

        return res.json({
            original: originalResult,
            thumbnail: thumbnailResult,
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
