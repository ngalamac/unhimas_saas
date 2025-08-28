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
  const debug = process.env.AUTH_DEBUG === 'true';
  if (!header || !header.startsWith('Bearer ')) {
    if (debug) console.debug('[auth] Missing or invalid Authorization header', { ip: req.ip, method: req.method, url: req.originalUrl });
    return res.status(401).json({ message: 'Missing or invalid authorization' });
  }
  const parts = header.split(' ');
  const token = parts.length > 1 ? parts[1] : null;
  if (!token) {
    if (debug) console.debug('[auth] Authorization header present but token missing', { ip: req.ip, method: req.method, url: req.originalUrl });
    return res.status(401).json({ message: 'Missing or invalid authorization token' });
  }
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    // payload may contain id and type depending on auth implementation
    req.user = { id: payload.id || payload.userId || null, type: payload.type || payload.role || null };
    if (debug) console.debug('[auth] Token verified', { ip: req.ip, userId: req.user.id, userType: req.user.type, url: req.originalUrl });
    return next();
  } catch (err: any) {
    // provide helpful debug info without logging token or secret
    if (debug) {
      const reason = err && err.name ? `${err.name}: ${err.message || ''}` : 'Verification failed';
      console.debug('[auth] Token verification failed', { reason, ip: req.ip, method: req.method, url: req.originalUrl });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export default authMiddleware;
