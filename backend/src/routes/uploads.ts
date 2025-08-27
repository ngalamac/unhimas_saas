import express, { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FileFilterCallback } from 'multer';

const router = express.Router();

// Use process.cwd() so path is correct when running from backend folder (ts-node)
const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
// ensure uploadDir exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (err: any, dest: string) => void) => {
    try {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err as any, uploadDir);
    }
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (err: any, name: string) => void) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Single file upload for profile images
router.post('/profile', upload.single('file'), (req: Request & { file?: Express.Multer.File }, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  // return accessible URL (server should serve /uploads)
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// multer error handler for payload too large
router.use((err: any, _req: any, res: any, _next: any) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Max size is 5MB.' });
  }
  // forward other errors
  return res.status(500).json({ message: 'Upload error', error: err?.message });
});

export default router;
