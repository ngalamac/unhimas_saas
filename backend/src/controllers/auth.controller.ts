import { Request, Response } from 'express';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';
import { prisma } from '../utils/db-temp';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email: username },
          ],
          isActive: true,
        },
        include: {
          employee: {
            include: {
              department: true,
            },
          },
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: await this.getUserPermissions(user.role),
      });

      // Create user session
      await prisma.userSession.create({
        data: {
          userId: user.id,
          role: user.role,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        },
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: 'Internal server error',
      });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, firstName, lastName, phoneNumber, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email },
          ],
        },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this username or email already exists',
        });
        return;
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          role,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: 'Internal server error',
      });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user) {
        // Deactivate user sessions
        await prisma.userSession.updateMany({
          where: {
            userId: req.user.id,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: 'Internal server error',
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            include: {
              department: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user },
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: 'Internal server error',
      });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: 'Internal server error',
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent',
      });

      // TODO: Implement email sending logic
      if (user) {
        logger.info(`Password reset requested for user: ${user.email}`);
        // Send password reset email
      }
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: 'Internal server error',
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement password reset logic with token verification
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: 'Internal server error',
      });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement email verification logic
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      logger.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify email',
        error: 'Internal server error',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement token refresh logic
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
        error: 'Internal server error',
      });
    }
  }

  private async getUserPermissions(role: string): Promise<string[]> {
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
  }
}