import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function addCsrfToken(req: Request, res: Response, next: NextFunction) {
    const csrfToken = crypto.randomBytes(16).toString('hex');
    res.cookie('csrf-token', csrfToken, { httpOnly: false }); // httpOnly: false so client can read it
    res.locals.csrfToken = csrfToken;
    next();
}

export function verifyCsrfToken(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
    }

    const csrfTokenFromCookie = req.cookies['csrf-token'];
    const csrfTokenFromHeader = req.headers['x-csrf-token'];

    if (!csrfTokenFromCookie || !csrfTokenFromHeader || csrfTokenFromCookie !== csrfTokenFromHeader) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    next();
}
