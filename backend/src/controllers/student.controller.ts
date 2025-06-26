import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationQuery } from '../types';
import { generateStudentId, getPaginationParams, getPaginationMeta } from '../utils/helpers';
import logger from '../utils/logger';
import { prisma } from '../utils/db-temp';

export class StudentController {
  async getAllStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query as PaginationQuery;
      
      const { skip, take } = getPaginationParams(Number(page), Number(limit));
      
      const where: any = {
        isActive: true,
      };

      // Add search functionality
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { studentId: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Role-based filtering
      if (req.user?.role === 'HEAD_OF_DEPARTMENT') {
        // HOD can only see students from their department
        const employee = await prisma.employee.findFirst({
          where: { userId: req.user.id },
        });
        
        if (employee?.departmentId) {
          where.departmentId = employee.departmentId;
        }
      }

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            program: true,
            department: true,
          },
        }),
        prisma.student.count({ where }),
      ]);

      const pagination = getPaginationMeta(total, Number(page), Number(limit));

      const response: ApiResponse = {
        success: true,
        message: 'Students retrieved successfully',
        data: students,
        pagination,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get all students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students',
        error: 'Internal server error',
      });
    }
  }

  async getStudentById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          program: true,
          department: true,
          grades: {
            include: {
              course: true,
            },
          },
          attendance: {
            include: {
              course: true,
            },
          },
          payments: true,
        },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Role-based access control
      if (req.user?.role === 'HEAD_OF_DEPARTMENT') {
        const employee = await prisma.employee.findFirst({
          where: { userId: req.user.id },
        });
        
        if (employee?.departmentId !== student.departmentId) {
          res.status(403).json({
            success: false,
            message: 'Access denied',
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Student retrieved successfully',
        data: student,
      });
    } catch (error) {
      logger.error('Get student by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student',
        error: 'Internal server error',
      });
    }
  }

  async createStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentData = req.body;

      // Generate unique student ID
      const currentYear = new Date().getFullYear();
      const lastStudent = await prisma.student.findFirst({
        where: {
          studentId: {
            startsWith: `STU-${currentYear}`,
          },
        },
        orderBy: {
          studentId: 'desc',
        },
      });

      let sequence = 1;
      if (lastStudent) {
        const lastSequence = parseInt(lastStudent.studentId.split('-')[2]);
        sequence = lastSequence + 1;
      }

      const studentId = generateStudentId(currentYear, sequence);

      const student = await prisma.student.create({
        data: {
          ...studentData,
          studentId,
          dateOfBirth: new Date(studentData.dateOfBirth),
          registrationDate: new Date(studentData.registrationDate || new Date()),
        },
        include: {
          program: true,
          department: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student,
      });
    } catch (error) {
      logger.error('Create student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create student',
        error: 'Internal server error',
      });
    }
  }

  async updateStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Convert date fields if provided
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }
      if (updateData.registrationDate) {
        updateData.registrationDate = new Date(updateData.registrationDate);
      }

      const student = await prisma.student.update({
        where: { id },
        data: updateData,
        include: {
          program: true,
          department: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student,
      });
    } catch (error) {
      logger.error('Update student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student',
        error: 'Internal server error',
      });
    }
  }

  async deleteStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Soft delete by setting isActive to false
      await prisma.student.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
      });
    } catch (error) {
      logger.error('Delete student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete student',
        error: 'Internal server error',
      });
    }
  }

  async getStudentGrades(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const grades = await prisma.grade.findMany({
        where: { studentId: id },
        include: {
          course: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          recordedDate: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Student grades retrieved successfully',
        data: grades,
      });
    } catch (error) {
      logger.error('Get student grades error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student grades',
        error: 'Internal server error',
      });
    }
  }

  async getStudentAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const attendance = await prisma.attendance.findMany({
        where: { studentId: id },
        include: {
          course: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Student attendance retrieved successfully',
        data: attendance,
      });
    } catch (error) {
      logger.error('Get student attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student attendance',
        error: 'Internal server error',
      });
    }
  }

  async getStudentPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const payments = await prisma.payment.findMany({
        where: { studentId: id },
        orderBy: {
          paymentDate: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Student payments retrieved successfully',
        data: payments,
      });
    } catch (error) {
      logger.error('Get student payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student payments',
        error: 'Internal server error',
      });
    }
  }

  async getStudentFeeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          program: true,
          payments: {
            where: {
              status: 'COMPLETED',
            },
          },
        },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      // Get fee structure for the student
      const feeStructure = await prisma.feeStructure.findFirst({
        where: {
          programId: student.programId,
          level: student.level,
          batch: student.batch,
          isActive: true,
        },
      });

      const totalPaid = student.payments.reduce((sum: number, payment: any) => 
        sum + parseFloat(payment.amount.toString()), 0
      );

      const totalFee = feeStructure ? parseFloat(feeStructure.totalFee.toString()) : 0;
      const balance = totalFee - totalPaid;

      res.status(200).json({
        success: true,
        message: 'Student fee status retrieved successfully',
        data: {
          student: {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            studentId: student.studentId,
            tuitionStatus: student.tuitionStatus,
          },
          feeStructure,
          totalFee,
          totalPaid,
          balance,
          payments: student.payments,
        },
      });
    } catch (error) {
      logger.error('Get student fee status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student fee status',
        error: 'Internal server error',
      });
    }
  }

  async searchStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { query } = req.params;

      const students = await prisma.student.findMany({
        where: {
          isActive: true,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { studentId: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          program: true,
          department: true,
        },
        take: 20,
      });

      res.status(200).json({
        success: true,
        message: 'Students search completed',
        data: students,
      });
    } catch (error) {
      logger.error('Search students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search students',
        error: 'Internal server error',
      });
    }
  }

  async getStudentsByProgram(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { programId } = req.params;

      const students = await prisma.student.findMany({
        where: {
          programId,
          isActive: true,
        },
        include: {
          program: true,
          department: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Students by program retrieved successfully',
        data: students,
      });
    } catch (error) {
      logger.error('Get students by program error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students by program',
        error: 'Internal server error',
      });
    }
  }

  async getStudentsByDepartment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;

      const students = await prisma.student.findMany({
        where: {
          departmentId,
          isActive: true,
        },
        include: {
          program: true,
          department: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Students by department retrieved successfully',
        data: students,
      });
    } catch (error) {
      logger.error('Get students by department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students by department',
        error: 'Internal server error',
      });
    }
  }

  async getStudentsByBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { batch } = req.params;

      const students = await prisma.student.findMany({
        where: {
          batch,
          isActive: true,
        },
        include: {
          program: true,
          department: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Students by batch retrieved successfully',
        data: students,
      });
    } catch (error) {
      logger.error('Get students by batch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students by batch',
        error: 'Internal server error',
      });
    }
  }

  async bulkImportStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // TODO: Implement bulk import functionality
      res.status(200).json({
        success: true,
        message: 'Bulk import completed',
        data: { imported: 0, failed: 0 },
      });
    } catch (error) {
      logger.error('Bulk import students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import students',
        error: 'Internal server error',
      });
    }
  }

  async bulkUpdateStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // TODO: Implement bulk update functionality
      res.status(200).json({
        success: true,
        message: 'Bulk update completed',
        data: { updated: 0, failed: 0 },
      });
    } catch (error) {
      logger.error('Bulk update students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update students',
        error: 'Internal server error',
      });
    }
  }
}