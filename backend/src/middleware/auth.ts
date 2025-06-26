import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../utils/db-temp';
import logger from '../utils/logger';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    // Get user permissions based on role
    const permissions = await getUserPermissions(user.role);

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const authorize = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const userPermissions = req.user.permissions;
    
    // Super admin has all permissions
    if (userPermissions.includes('all')) {
      next();
      return;
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied for your role',
      });
      return;
    }

    next();
  };
};

// Helper function to get user permissions based on role
const getUserPermissions = async (role: string): Promise<string[]> => {
  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: ['all'],
    ADMIN: [
      'students', 'fees', 'reports', 'announcements', 'branches', 
      'programs', 'departments', 'payments', 'accounting'
    ],
    LECTURER: [
      'students', 'grades', 'attendance', 'courses', 'academic_reports'
    ],
    ACCOUNTANT: [
      'fees', 'payments', 'financial_reports', 'accounting'
    ],
    DEAN_OF_STUDIES: [
      'students', 'courses', 'programs', 'academic_reports', 'grades', 'departments'
    ],
    HEAD_OF_DEPARTMENT: [
      'department_students', 'department_courses', 'department_reports', 'grades', 'attendance'
    ],
  };

  return rolePermissions[role] || [];
};