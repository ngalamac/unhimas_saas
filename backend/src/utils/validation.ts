import Joi from 'joi';

// User validation schemas
export const userRegistrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'LECTURER', 'ACCOUNTANT', 'DEAN_OF_STUDIES', 'HEAD_OF_DEPARTMENT').required(),
});

export const userLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

// Student validation schemas
export const studentRegistrationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  nationalIdName: Joi.string().min(2).max(100).required(),
  gender: Joi.string().valid('MALE', 'FEMALE').required(),
  placeOfBirth: Joi.string().min(2).max(100).required(),
  dateOfBirth: Joi.date().max('now').required(),
  motherName: Joi.string().min(2).max(100).required(),
  fatherName: Joi.string().min(2).max(100).required(),
  address: Joi.string().min(10).max(500).required(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  email: Joi.string().email().required(),
  programId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().required(),
  session: Joi.string().valid('DAY', 'EVENING').required(),
  level: Joi.number().integer().min(1).max(6).required(),
  batch: Joi.string().required(),
});

// Program validation schemas
export const programSchema = Joi.object({
  name: Joi.string().min(5).max(200).required(),
  type: Joi.string().valid('HND', 'BACHELOR', 'MASTERS').required(),
  duration: Joi.number().integer().min(1).max(6).required(),
  semestersPerYear: Joi.number().integer().min(1).max(3).required(),
  departmentId: Joi.string().uuid().required(),
  hodId: Joi.string().uuid().optional(),
});

// Course validation schemas
export const courseSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  code: Joi.string().min(3).max(20).required(),
  creditValue: Joi.number().integer().min(1).max(10).required(),
  semester: Joi.number().integer().min(1).max(3).required(),
  level: Joi.number().integer().min(1).max(6).required(),
  batch: Joi.string().required(),
  lecturerId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().required(),
  programId: Joi.string().uuid().required(),
});

// Grade validation schemas
export const gradeSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  courseId: Joi.string().uuid().required(),
  caScore: Joi.number().min(0).max(30).required(),
  examScore: Joi.number().min(0).max(70).required(),
  semester: Joi.number().integer().min(1).max(3).required(),
  academicYear: Joi.string().required(),
  batch: Joi.string().required(),
});

// Payment validation schemas
export const paymentSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid('CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'ONLINE').required(),
  paymentType: Joi.string().valid('TUITION', 'REGISTRATION', 'EXAM', 'LIBRARY', 'OTHER').required(),
  paymentDate: Joi.date().required(),
  reference: Joi.string().min(5).max(50).required(),
  batch: Joi.string().required(),
  notes: Joi.string().max(500).optional(),
});

// Fee structure validation schemas
export const feeStructureSchema = Joi.object({
  programId: Joi.string().uuid().required(),
  level: Joi.number().integer().min(1).max(6).required(),
  batch: Joi.string().required(),
  tuitionFee: Joi.number().positive().required(),
  registrationFee: Joi.number().positive().required(),
  examFee: Joi.number().positive().required(),
  libraryFee: Joi.number().positive().required(),
});

// Attendance validation schemas
export const attendanceSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  courseId: Joi.string().uuid().required(),
  date: Joi.date().required(),
  status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE').required(),
  method: Joi.string().valid('MANUAL', 'QR_CODE').required(),
  batch: Joi.string().required(),
});

// Announcement validation schemas
export const announcementSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(10).max(5000).required(),
  targetAudience: Joi.string().valid('ALL', 'STUDENTS', 'STAFF', 'PARENTS', 'SPECIFIC').required(),
  targetGroups: Joi.array().items(Joi.string()).optional(),
  targetBatch: Joi.string().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM'),
  scheduledFor: Joi.date().optional(),
});

// Message validation schemas
export const messageSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(10).max(1000).required(),
  type: Joi.string().valid('SMS', 'EMAIL').required(),
  targetAudience: Joi.string().required(),
  targetBatch: Joi.string().optional(),
  scheduledFor: Joi.date().optional(),
});

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional(),
});