import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';
import { GradeCalculation, FeeCalculation } from '../types';

// Generate unique IDs
export const generateStudentId = (year: number, sequence: number): string => {
  return `STU-${year}-${sequence.toString().padStart(3, '0')}`;
};

export const generateEmployeeId = (year: number, sequence: number): string => {
  return `EMP-${year}-${sequence.toString().padStart(3, '0')}`;
};

export const generatePaymentReference = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${timestamp.slice(-6)}-${random}`;
};

// Grade calculations
export const calculateGrade = (caScore: number, examScore: number): GradeCalculation => {
  const totalScore = caScore + examScore;
  let grade: string;
  let gpa: number;

  if (totalScore >= 80) {
    grade = 'A';
    gpa = 4.0;
  } else if (totalScore >= 70) {
    grade = 'B';
    gpa = 3.0;
  } else if (totalScore >= 60) {
    grade = 'C';
    gpa = 2.0;
  } else if (totalScore >= 50) {
    grade = 'D';
    gpa = 1.0;
  } else {
    grade = 'F';
    gpa = 0.0;
  }

  return {
    caScore,
    examScore,
    totalScore,
    grade,
    gpa,
  };
};

// Fee calculations
export const calculateTotalFee = (
  tuitionFee: number,
  registrationFee: number,
  examFee: number,
  libraryFee: number
): FeeCalculation => {
  const totalFee = tuitionFee + registrationFee + examFee + libraryFee;
  
  return {
    tuitionFee,
    registrationFee,
    examFee,
    libraryFee,
    totalFee,
  };
};

// Date utilities
export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Academic year starts in September (month 8)
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

export const formatCurrency = (amount: number | Decimal, currency: string = 'XAF'): string => {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(numAmount);
};

// String utilities
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const capitalizeWords = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Encryption utilities
export const encrypt = (text: string, key: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decrypt = (encryptedText: string, key: string): string => {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// Pagination utilities
export const getPaginationParams = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const take = limit;
  
  return { skip, take };
};

export const getPaginationMeta = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

export const isPDFFile = (mimetype: string): boolean => {
  return mimetype === 'application/pdf';
};

// Random utilities
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// QR Code utilities
export const generateQRData = (studentId: string, courseId: string): string => {
  const timestamp = new Date().toISOString();
  const data = { studentId, courseId, timestamp };
  return JSON.stringify(data);
};

export const parseQRData = (qrData: string): { studentId: string; courseId: string; timestamp: string } | null => {
  try {
    const data = JSON.parse(qrData);
    if (data.studentId && data.courseId && data.timestamp) {
      return data;
    }
    return null;
  } catch (error) {
    return null;
  }
};