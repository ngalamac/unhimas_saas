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
  registrationDate: string;
  tuitionStatus: 'Paid' | 'Partial' | 'Unpaid';
  profileImage?: string;
}

export interface Program {
  id: string;
  name: string;
  type: 'HND' | 'Bachelor' | 'Masters';
  duration: number; // in years
  semestersPerYear: number;
  courses: Course[];
  hod?: Employee;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hod?: Employee;
  programs: Program[];
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
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'HOD' | 'Lecturer' | 'Admin' | 'Accountant' | 'Staff';
  department?: Department;
  hireDate: string;
  salary: number;
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
}

export interface FeeStructure {
  id: string;
  programId: string;
  level: number;
  tuitionFee: number;
  registrationFee: number;
  examFee: number;
  libraryFee: number;
  totalFee: number;
  currency: 'XAF'; // Francs CFA
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
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  method: 'Manual' | 'QR Code';
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Students' | 'Staff' | 'Parents' | 'Specific';
  targetGroups?: string[];
  createdBy: string;
  createdAt: string;
  scheduledFor?: string;
  status: 'Draft' | 'Scheduled' | 'Sent';
}