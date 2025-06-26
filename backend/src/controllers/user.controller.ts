import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';
import { prisma } from '../utils/db-temp';

export class UserController {
  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: 'Internal server error',
      });
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
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
          sessions: {
            where: {
              isActive: true,
            },
            orderBy: {
              lastActivity: 'desc',
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
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: 'Internal server error',
      });
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.id;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: 'Internal server error',
      });
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (req.user?.id === id) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
        return;
      }

      // Soft delete by setting isActive to false
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: 'Internal server error',
      });
    }
  }

  async activateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.user.update({
        where: { id },
        data: { isActive: true },
      });

      res.status(200).json({
        success: true,
        message: 'User activated successfully',
      });
    } catch (error) {
      logger.error('Activate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate user',
        error: 'Internal server error',
      });
    }
  }

  async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent self-deactivation
      if (req.user?.id === id) {
        res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
        return;
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      logger.error('Deactivate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate user',
        error: 'Internal server error',
      });
    }
  }
}