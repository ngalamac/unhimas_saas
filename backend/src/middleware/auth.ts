import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User';
import BranchModel from '../models/BranchModel';
import mongoose from 'mongoose';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'unhimas_secret';

// Define the role hierarchy. Lower number = higher rank.
const roleHierarchy: Record<string, number> = {
    'SuperAdmin': 0,
    'Admin': 1,
    'Dean of Studies': 2,
    'Head Of Department': 3,
    'Accountant': 4,
    'Lecturer': 5,
};

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

        const [feature, action] = permission.split(':');
        if (!feature || !action) {
            console.warn(`[auth] Invalid permission format: ${permission}`);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const userPermissions = req.user.permissions || {};
        const featurePermissions = userPermissions[feature];

        if (featurePermissions && featurePermissions[action]) {
            return next(); // User has the specific permission
        }

        if (process.env.AUTH_DEBUG === 'true') {
            console.debug('[auth] Permission denied', {
                userId: req.user.id,
                required: permission,
                actual: userPermissions
            });
        }

        return res.status(403).json({ error: 'Insufficient permissions' });
    };
}

// Middleware to ensure user can only access their branch data
export function requireBranchAccess(paramName: string = 'branchId') {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // SuperAdmin can access all branches
        if (req.user.isSuperAdmin) {
            return next();
        }

        const requestedBranch = req.params[paramName] || req.body[paramName] || req.query[paramName] || req.body.branch || req.query.branch;

        // If a branch is specified in the request, it must match the user's branch
        if (requestedBranch) {
            if (requestedBranch !== req.user.branch) {
                return res.status(403).json({ error: 'Access denied: You do not have permission to access this branch.' });
            }
        }

        // For list queries, if no branch is specified, we should default to the user's branch
        // to prevent accidental data leakage from other branches.
        if ((req.method === 'GET' || req.method === 'HEAD') && !req.query.branch && req.user.branch) {
            // This is a potential source of bugs if not all list routes are designed to use `query.branch`.
            // However, it's a good defensive measure.
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

        // A user must have a role to manage other users
        if (!req.user.type) {
            return res.status(403).json({ error: 'Insufficient permissions: User role not defined' });
        }

        // For operations on a specific user, enforce branch and role hierarchy
        if (req.params.id) {
            // Prevent users from managing themselves
            if (req.params.id === req.user.id) {
                return res.status(403).json({ error: 'You cannot manage your own account' });
            }

            try {
                const userToManage = await User.findById(req.params.id).select('branch type');
                if (!userToManage) {
                    return res.status(404).json({ error: 'User to manage not found' });
                }

                // Branch managers can only manage users in their own branch
                if (req.user.isBranchManager && userToManage.branch?.toString() !== req.user.branch) {
                    return res.status(403).json({ error: 'Access denied: You can only manage users in your own branch.' });
                }

                // Enforce role hierarchy
                const currentUserRoleLevel = roleHierarchy[req.user.type];
                const targetUserRoleLevel = roleHierarchy[userToManage.type];

                if (currentUserRoleLevel === undefined || targetUserRoleLevel === undefined) {
                    return res.status(500).json({ error: 'Server error: Unknown user role encountered' });
                }

                if (currentUserRoleLevel >= targetUserRoleLevel) {
                    return res.status(403).json({ error: 'Access denied: You cannot manage users with an equal or higher role.' });
                }

            } catch (error) {
                console.error('[auth] Error in requireUserManagement:', error);
                return res.status(500).json({ error: 'Server error during user management check' });
            }
        }

        // For creating users (no req.params.id), role/branch checks are handled in the route.
        return next();
    };
}
