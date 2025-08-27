import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'unhimas_secret';

export interface AuthRequest extends Request {
  user?: { id?: string; type?: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || req.headers.Authorization as string | undefined;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing or invalid authorization' });
  const parts = header.split(' ');
  const token = parts.length > 1 ? parts[1] : null;
  if (!token) return res.status(401).json({ message: 'Missing or invalid authorization token' });
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    // payload may contain id and type depending on auth implementation
    req.user = { id: payload.id || payload.userId || null, type: payload.type || payload.role || null };
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export default authMiddleware;
