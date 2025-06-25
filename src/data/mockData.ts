import { Student, Program, Department, Course, Employee, Grade, FeeStructure, Payment, Branch, Attendance, Announcement } from '../types/school';

// Mock Departments
export const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Computer Engineering',
    code: 'CE',
    programs: []
  },
  {
    id: '2',
    name: 'Human Resource Management',
    code: 'HRM',
    programs: []
  },
  {
    id: '3',
    name: 'Transport and Logistics',
    code: 'TL',
    programs: []
  },
  {
    id: '4',
    name: 'Accounting',
    code: 'ACC',
    programs: []
  },
  {
    id: '5',
    name: 'Business Administration',
    code: 'BA',
    programs: []
  }
];

// Mock Employees
export const mockEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Dr. Jean',
    lastName: 'Mbarga',
    email: 'j.mbarga@unhimas.edu.cm',
    phoneNumber: '+237 677 123 456',
    role: 'HOD',
    department: mockDepartments[0],
    hireDate: '2020-01-15',
    salary: 850000
  },
  {
    id: '2',
    firstName: 'Prof. Marie',
    lastName: 'Nkomo',
    email: 'm.nkomo@unhimas.edu.cm',
    phoneNumber: '+237 677 234 567',
    role: 'Lecturer',
    department: mockDepartments[0],
    hireDate: '2019-09-01',
    salary: 650000
  },
  {
    id: '3',
    firstName: 'Dr. Paul',
    lastName: 'Fotso',
    email: 'p.fotso@unhimas.edu.cm',
    phoneNumber: '+237 677 345 678',
    role: 'HOD',
    department: mockDepartments[1],
    hireDate: '2018-03-10',
    salary: 850000
  }
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: '1',
    name: 'Data Structures and Algorithms',
    code: 'CE201',
    creditValue: 4,
    lecturer: mockEmployees[1],
    department: mockDepartments[0],
    semester: 1,
    level: 2
  },
  {
    id: '2',
    name: 'Database Management Systems',
    code: 'CE301',
    creditValue: 3,
    lecturer: mockEmployees[1],
    department: mockDepartments[0],
    semester: 1,
    level: 3
  },
  {
    id: '3',
    name: 'Human Resource Planning',
    code: 'HRM201',
    creditValue: 3,
    lecturer: mockEmployees[2],
    department: mockDepartments[1],
    semester: 1,
    level: 2
  }
];

// Mock Programs
export const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'Higher National Diploma in Computer Engineering',
    type: 'HND',
    duration: 2,
    semestersPerYear: 2,
    courses: [mockCourses[0], mockCourses[1]],
    hod: mockEmployees[0]
  },
  {
    id: '2',
    name: 'Bachelor of Science in Computer Engineering',
    type: 'Bachelor',
    duration: 3,
    semestersPerYear: 2,
    courses: [mockCourses[0], mockCourses[1]],
    hod: mockEmployees[0]
  },
  {
    id: '3',
    name: 'Higher National Diploma in Human Resource Management',
    type: 'HND',
    duration: 2,
    semestersPerYear: 2,
    courses: [mockCourses[2]],
    hod: mockEmployees[2]
  }
];

// Mock Students
export const mockStudents: Student[] = [
  {
    id: '1',
    firstName: 'Alain',
    lastName: 'Kamga',
    nationalIdName: 'Alain Kamga Fotso',
    gender: 'Male',
    placeOfBirth: 'Douala, Cameroon',
    dateOfBirth: '2001-05-15',
    motherName: 'Marie Kamga',
    fatherName: 'Pierre Fotso',
    address: 'Bonanjo, Douala',
    phoneNumber: '+237 677 987 654',
    email: 'alain.kamga@student.unhimas.edu.cm',
    program: mockPrograms[0],
    department: mockDepartments[0],
    session: 'Day',
    level: 2,
    registrationDate: '2023-09-01',
    tuitionStatus: 'Paid'
  },
  {
    id: '2',
    firstName: 'Grace',
    lastName: 'Mballa',
    nationalIdName: 'Grace Mballa Nkomo',
    gender: 'Female',
    placeOfBirth: 'Yaoundé, Cameroon',
    dateOfBirth: '2000-12-03',
    motherName: 'Josephine Mballa',
    fatherName: 'Samuel Nkomo',
    address: 'Bastos, Yaoundé',
    phoneNumber: '+237 677 876 543',
    email: 'grace.mballa@student.unhimas.edu.cm',
    program: mockPrograms[1],
    department: mockDepartments[0],
    session: 'Day',
    level: 3,
    registrationDate: '2022-09-01',
    tuitionStatus: 'Partial'
  },
  {
    id: '3',
    firstName: 'Emmanuel',
    lastName: 'Biya',
    nationalIdName: 'Emmanuel Biya Mvondo',
    gender: 'Male',
    placeOfBirth: 'Bamenda, Cameroon',
    dateOfBirth: '2002-08-20',
    motherName: 'Christine Biya',
    fatherName: 'Joseph Mvondo',
    address: 'Commercial Avenue, Bamenda',
    phoneNumber: '+237 677 765 432',
    email: 'emmanuel.biya@student.unhimas.edu.cm',
    program: mockPrograms[2],
    department: mockDepartments[1],
    session: 'Evening',
    level: 1,
    registrationDate: '2024-09-01',
    tuitionStatus: 'Unpaid'
  }
];

// Mock Fee Structures
export const mockFeeStructures: FeeStructure[] = [
  {
    id: '1',
    programId: '1',
    level: 1,
    tuitionFee: 450000,
    registrationFee: 25000,
    examFee: 15000,
    libraryFee: 10000,
    totalFee: 500000,
    currency: 'XAF'
  },
  {
    id: '2',
    programId: '1',
    level: 2,
    tuitionFee: 475000,
    registrationFee: 25000,
    examFee: 15000,
    libraryFee: 10000,
    totalFee: 525000,
    currency: 'XAF'
  }
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: '1',
    studentId: '1',
    amount: 525000,
    currency: 'XAF',
    paymentMethod: 'Bank Transfer',
    paymentType: 'Tuition',
    status: 'Completed',
    paymentDate: '2024-09-15',
    reference: 'PAY-2024-001'
  },
  {
    id: '2',
    studentId: '2',
    amount: 300000,
    currency: 'XAF',
    paymentMethod: 'Mobile Money',
    paymentType: 'Tuition',
    status: 'Completed',
    paymentDate: '2024-09-10',
    reference: 'PAY-2024-002'
  }
];

// Mock Branches
export const mockBranches: Branch[] = [
  {
    id: '1',
    name: 'UNHIMAS Main Campus',
    address: 'Bonanjo, Douala',
    phoneNumber: '+237 233 123 456',
    email: 'main@unhimas.edu.cm',
    manager: mockEmployees[0],
    isActive: true,
    establishedDate: '2015-01-01'
  },
  {
    id: '2',
    name: 'UNHIMAS Yaoundé Branch',
    address: 'Bastos, Yaoundé',
    phoneNumber: '+237 222 234 567',
    email: 'yaounde@unhimas.edu.cm',
    manager: mockEmployees[2],
    isActive: true,
    establishedDate: '2018-09-01'
  },
  {
    id: '3',
    name: 'UNHIMAS Bamenda Branch',
    address: 'Commercial Avenue, Bamenda',
    phoneNumber: '+237 233 345 678',
    email: 'bamenda@unhimas.edu.cm',
    manager: mockEmployees[1],
    isActive: false,
    establishedDate: '2020-01-15'
  }
];

// Mock Grades
export const mockGrades: Grade[] = [
  {
    id: '1',
    studentId: '1',
    courseId: '1',
    caScore: 25,
    examScore: 65,
    totalScore: 90,
    grade: 'A',
    gpa: 4.0,
    semester: 1,
    academicYear: '2024-2025'
  },
  {
    id: '2',
    studentId: '2',
    courseId: '2',
    caScore: 22,
    examScore: 58,
    totalScore: 80,
    grade: 'B',
    gpa: 3.0,
    semester: 1,
    academicYear: '2024-2025'
  }
];

// Mock Attendance
export const mockAttendance: Attendance[] = [
  {
    id: '1',
    studentId: '1',
    courseId: '1',
    date: '2024-12-16',
    status: 'Present',
    method: 'QR Code',
    timestamp: '2024-12-16T08:30:00Z'
  },
  {
    id: '2',
    studentId: '2',
    courseId: '2',
    date: '2024-12-16',
    status: 'Late',
    method: 'Manual',
    timestamp: '2024-12-16T08:45:00Z'
  }
];

// Mock Announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Semester Examination Schedule',
    content: 'The first semester examinations will commence on January 15, 2025. All students are advised to check their examination timetables.',
    targetAudience: 'Students',
    createdBy: 'Admin',
    createdAt: '2024-12-10T10:00:00Z',
    scheduledFor: '2024-12-17T08:00:00Z',
    status: 'Scheduled'
  },
  {
    id: '2',
    title: 'Fee Payment Deadline',
    content: 'All outstanding fees must be paid before December 31, 2024. Late payment will attract a fine of 25,000 XAF.',
    targetAudience: 'Students',
    createdBy: 'Accounts',
    createdAt: '2024-12-01T14:00:00Z',
    status: 'Sent'
  }
];