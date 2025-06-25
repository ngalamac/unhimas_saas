export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  nationalIdName: string;
  gender: 'Male' | 'Female';
  placeOfBirth: string;
  dateOfBirth: string;
  motherName: string;
  fatherName: string;
  address: string;
  phoneNumber: string;
  email: string;
  program: Program;
  department: Department;
  session: 'Day' | 'Evening';
  level: number;
  batch: string; // Academic year batch (e.g., "2024-2025")
  registrationDate: string;
  tuitionStatus: 'Paid' | 'Partial' | 'Unpaid';
  profileImage?: string;
  studentId: string; // Generated student ID
}

export interface Program {
  id: string;
  name: string;
  type: 'HND' | 'Bachelor' | 'Masters';
  duration: number; // in years
  semestersPerYear: number;
  courses: Course[];
  hod?: Employee;
  isActive: boolean;
  createdDate: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hod?: Employee;
  programs: Program[];
  isActive: boolean;
  createdDate: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  creditValue: number;
  lecturer?: Employee;
  department: Department;
  semester: number;
  level: number;
  isActive: boolean;
  batch: string; // Academic year
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'HOD' | 'Lecturer' | 'Admin' | 'Accountant' | 'Staff' | 'Dean';
  department?: Department;
  hireDate: string;
  salary: number;
  isActive: boolean;
  employeeId: string;
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  caScore: number; // 30%
  examScore: number; // 70%
  totalScore: number; // out of 100
  grade: string; // A, B, C, D, F
  gpa: number; // out of 4.0
  semester: number;
  academicYear: string;
  batch: string;
  recordedDate: string;
  recordedBy: string;
}

export interface FeeStructure {
  id: string;
  programId: string;
  level: number;
  batch: string; // Academic year
  tuitionFee: number;
  registrationFee: number;
  examFee: number;
  libraryFee: number;
  totalFee: number;
  currency: 'XAF'; // Francs CFA
  isActive: boolean;
  createdDate: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  currency: 'XAF';
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online';
  paymentType: 'Tuition' | 'Registration' | 'Exam' | 'Library' | 'Other';
  status: 'Completed' | 'Pending' | 'Failed';
  paymentDate: string;
  reference: string;
  batch: string;
  processedBy: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  manager: Employee;
  isActive: boolean;
  establishedDate: string;
  studentCount: number;
  staffCount: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  method: 'Manual' | 'QR Code';
  timestamp: string;
  batch: string;
  recordedBy: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Students' | 'Staff' | 'Parents' | 'Specific';
  targetGroups?: string[];
  targetBatch?: string;
  createdBy: string;
  createdAt: string;
  scheduledFor?: string;
  status: 'Draft' | 'Scheduled' | 'Sent';
  priority: 'Low' | 'Medium' | 'High';
}

export interface Message {
  id: string;
  title: string;
  content: string;
  type: 'SMS' | 'Email';
  targetAudience: string;
  targetBatch?: string;
  recipients: number;
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Failed';
  scheduledFor?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdDate: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface TwoFactorAuth {
  id: string;
  userId: string;
  isEnabled: boolean;
  method: 'SMS' | 'Email' | 'Authenticator';
  backupCodes: string[];
  lastUsed?: string;
  setupDate: string;
}

export interface OfficeAccount {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference: string;
  createdBy: string;
  batch: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface IDCard {
  id: string;
  type: 'Student' | 'Employee' | 'Admit' | 'Certificate';
  holderName: string;
  holderId: string;
  cardNumber: string;
  issueDate: string;
  expiryDate?: string;
  template: string;
  qrCode: string;
  status: 'Active' | 'Expired' | 'Revoked';
  batch?: string;
  issuedBy: string;
}

export interface Batch {
  id: string;
  name: string; // e.g., "2024-2025"
  startDate: string;
  endDate: string;
  isActive: boolean;
  description: string;
  createdDate: string;
}

export interface AdmissionApplication {
  id: string;
  applicantName: string;
  email: string;
  phoneNumber: string;
  programId: string;
  documents: string[];
  status: 'Pending' | 'Approved' | 'Rejected';
  applicationDate: string;
  batch: string;
  feesPaid: boolean;
  reviewedBy?: string;
  reviewDate?: string;
  comments?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  role: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface SystemSettings {
  id: string;
  currentBatch: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  currency: 'XAF';
  timezone: string;
  academicYearStart: string;
  academicYearEnd: string;
  gradePassingMark: number;
  maxStudentsPerClass: number;
  enableQRAttendance: boolean;
  enableSMSNotifications: boolean;
  enableEmailNotifications: boolean;
}