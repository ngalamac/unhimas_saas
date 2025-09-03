import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User';
import BranchModel from '../models/BranchModel';
import mongoose from 'mongoose';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'unhimas_secret';

export interface AuthRequest extends Request {
  user?: { 
    id?: string; 
    type?: string; 
    branch?: string;
    permissions?: Record<string, Record<string, boolean>>;
    isSuperAdmin?: boolean;
    isBranchManager?: boolean;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
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
    const userId = payload.id || payload.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Fetch full user details from database
    const user = await User.findById(userId).populate('branch');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set user context with enhanced information
    req.user = {
      id: user._id.toString(),
      type: user.type,
      branch: user.branch ? (user.branch as any)._id?.toString() : undefined,
      permissions: user.permissions,
      isSuperAdmin: user.type === 'SuperAdmin',
      isBranchManager: user.type === 'Admin'
    };

    if (debug) console.debug('[auth] Token verified', { 
      ip: req.ip, 
      userId: req.user.id, 
      userType: req.user.type, 
      branch: req.user.branch,
      url: req.originalUrl 
    });
    
    return next();
  } catch (err: any) {
    if (debug) {
      const reason = err && err.name ? `${err.name}: ${err.message || ''}` : 'Verification failed';
      console.debug('[auth] Token verification failed', { reason, ip: req.ip, method: req.method, url: req.originalUrl });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export default authMiddleware;

// Enhanced permissions middleware with hierarchical support
export function requirePermission(permission: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // SuperAdmin has all permissions
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Check if user has the specific permission
    const userPermissions = req.user.permissions || {};
    const hasPermission = Object.keys(userPermissions).some(feature => {
      const actions = userPermissions[feature];
      if (typeof actions === 'object') {
        return Object.values(actions).some(Boolean);
      }
      return false;
    });

    // Check for specific permission in the format "feature:action"
    const [feature, action] = permission.split(':');
    if (feature && action) {
      const featurePermissions = userPermissions[feature];
      if (featurePermissions && featurePermissions[action]) {
        return next();
      }
    }

    // Check for general permission
    if (userPermissions[permission] || hasPermission) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Middleware to ensure user can only access their branch data
export function requireBranchAccess() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // SuperAdmin can access all branches
    if (req.user.isSuperAdmin) {
      return next();
    }

    // For non-SuperAdmin users, ensure they can only access their branch data
    const requestedBranch = req.query.branch || req.body.branch || req.params.branchId;
    
    if (requestedBranch && requestedBranch !== req.user.branch) {
      return res.status(403).json({ error: 'Access denied: Branch mismatch' });
    }

    // If no branch specified, use user's branch
    if (!requestedBranch && req.user.branch) {
      req.query.branch = req.user.branch;
    }

    return next();
  };
}

// Middleware to check if user can manage other users
export function requireUserManagement() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // SuperAdmin can manage all users
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Branch managers can only manage users in their branch
    if (req.user.isBranchManager) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions for user management' });
  };
}
