import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export interface JWTPayload extends JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export interface SMSOptions {
  to: string;
  message: string;
}

export interface QRCodeData {
  studentId: string;
  courseId: string;
  timestamp: string;
  signature: string;
}

export interface GradeCalculation {
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gpa: number;
}

export interface FeeCalculation {
  tuitionFee: number;
  registrationFee: number;
  examFee: number;
  libraryFee: number;
  totalFee: number;
}

export interface AnalyticsData {
  totalStudents: number;
  totalRevenue: number;
  attendanceRate: number;
  averageGPA: number;
  programDistribution: Array<{
    program: string;
    count: number;
    percentage: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  departmentPerformance: Array<{
    department: string;
    averageGPA: number;
    studentCount: number;
  }>;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}