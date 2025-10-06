import { Student, Program, Department, Course, Employee, Grade, FeeStructure, Payment, Branch, Attendance, Announcement, Message, Role, Permission, Batch, AdmissionApplication, OfficeAccount } from '../types/school';

// Current date helpers
const getCurrentDate = () => new Date().toISOString().split('T')[0];
const getCurrentDateTime = () => new Date().toISOString();
const getCurrentBatch = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

// Mock Batches
export const mockBatches: Batch[] = [
  {
    id: '1',
    name: '2024-2025',
    startDate: '2024-09-01',
    endDate: '2025-07-31',
    isActive: true,
    description: 'Current Academic Year',
    createdDate: '2024-08-01'
  },
  {
    id: '2',
    name: '2023-2024',
    startDate: '2023-09-01',
    endDate: '2024-07-31',
    isActive: false,
    description: 'Previous Academic Year',
    createdDate: '2023-08-01'
  },
  {
    id: '3',
    name: '2025-2026',
    startDate: '2025-09-01',
    endDate: '2026-07-31',
    isActive: false,
    description: 'Next Academic Year',
    createdDate: '2025-08-01'
  }
];

// Mock Departments
export const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Computer Engineering',
    code: 'CE',
    programs: [],
    isActive: true,
    createdDate: '2020-01-15'
  },
  {
    id: '2',
    name: 'Human Resource Management',
    code: 'HRM',
    programs: [],
    isActive: true,
    createdDate: '2020-01-15'
  },
  {
    id: '3',
    name: 'Transport and Logistics',
    code: 'TL',
    programs: [],
    isActive: true,
    createdDate: '2020-01-15'
  },
  {
    id: '4',
    name: 'Accounting',
    code: 'ACC',
    programs: [],
    isActive: true,
    createdDate: '2020-01-15'
  },
  {
    id: '5',
    name: 'Business Administration',
    code: 'BA',
    programs: [],
    isActive: true,
    createdDate: '2020-01-15'
  },
  {
    id: '6',
    name: 'Engineering',
    code: 'ENG',
    programs: [],
    isActive: true,
    createdDate: '2020-01-15'
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
    salary: 850000,
    isActive: true,
    employeeId: 'EMP-2020-001'
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
    salary: 650000,
    isActive: true,
    employeeId: 'EMP-2019-015'
  },
  {
    id: '3',
    firstName: 'Dr. Paul',
    lastName: 'Fotso',
    email: 'p.fotso@unhimas.edu.cm',
    phoneNumber: '+237 677 345 678',
    role: 'HOD',
  department: Array.isArray(mockDepartments) && mockDepartments.length > 1 ? mockDepartments[1] : undefined,
    hireDate: '2018-03-10',
    salary: 850000,
    isActive: true,
    employeeId: 'EMP-2018-008'
  },
  {
    id: '4',
    firstName: 'Dr. Grace',
    lastName: 'Biya',
    email: 'g.biya@unhimas.edu.cm',
    phoneNumber: '+237 677 456 789',
    role: 'Dean',
    department: mockDepartments[2],
    hireDate: '2019-06-20',
    salary: 950000,
    isActive: true,
    employeeId: 'EMP-2019-025'
  },
  {
    id: '5',
    firstName: 'Prof. Samuel',
    lastName: 'Kamga',
    email: 's.kamga@unhimas.edu.cm',
    phoneNumber: '+237 677 567 890',
    role: 'Lecturer',
    department: mockDepartments[3],
    hireDate: '2020-02-10',
    salary: 650000,
    isActive: true,
    employeeId: 'EMP-2020-005'
  },
  {
    id: '6',
    firstName: 'Dr. Christine',
    lastName: 'Mvondo',
    email: 'c.mvondo@unhimas.edu.cm',
    phoneNumber: '+237 677 678 901',
    role: 'Admin',
    department: mockDepartments[4],
    hireDate: '2017-09-15',
    salary: 750000,
    isActive: true,
    employeeId: 'EMP-2017-012'
  }
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: '1',
    name: 'Data Structures and Algorithms',
    code: 'CE201',
    creditValue: 4,
  lecturer: Array.isArray(mockEmployees) && mockEmployees.length > 1 ? mockEmployees[1] : undefined,
    department: mockDepartments[0],
    semester: 1,
    level: 2,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '2',
    name: 'Database Management Systems',
    code: 'CE301',
    creditValue: 3,
  lecturer: Array.isArray(mockEmployees) && mockEmployees.length > 1 ? mockEmployees[1] : undefined,
    department: mockDepartments[0],
    semester: 1,
    level: 3,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '3',
    name: 'Human Resource Planning',
    code: 'HRM201',
    creditValue: 3,
    lecturer: mockEmployees[2],
  department: Array.isArray(mockDepartments) && mockDepartments.length > 1 ? mockDepartments[1] : undefined,
    semester: 1,
    level: 2,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '4',
    name: 'Web Development',
    code: 'CE202',
    creditValue: 4,
  lecturer: Array.isArray(mockEmployees) && mockEmployees.length > 1 ? mockEmployees[1] : undefined,
    department: mockDepartments[0],
    semester: 2,
    level: 2,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '5',
    name: 'Software Engineering',
    code: 'CE401',
    creditValue: 4,
    lecturer: mockEmployees[0],
    department: mockDepartments[0],
    semester: 1,
    level: 4,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '6',
    name: 'Organizational Behavior',
    code: 'HRM301',
    creditValue: 3,
    lecturer: mockEmployees[2],
  department: Array.isArray(mockDepartments) && mockDepartments.length > 1 ? mockDepartments[1] : undefined,
    semester: 1,
    level: 3,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '7',
    name: 'Supply Chain Management',
    code: 'TL201',
    creditValue: 3,
    lecturer: mockEmployees[3],
    department: mockDepartments[2],
    semester: 1,
    level: 2,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '8',
    name: 'Financial Accounting',
    code: 'ACC101',
    creditValue: 4,
    lecturer: mockEmployees[4],
    department: mockDepartments[3],
    semester: 1,
    level: 1,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '9',
    name: 'Business Strategy',
    code: 'BA301',
    creditValue: 3,
    lecturer: mockEmployees[5],
    department: mockDepartments[4],
    semester: 1,
    level: 3,
    isActive: true,
    batch: getCurrentBatch()
  },
  {
    id: '10',
    name: 'Project Management',
    code: 'BA401',
    creditValue: 4,
    lecturer: mockEmployees[5],
    department: mockDepartments[4],
    semester: 2,
    level: 4,
    isActive: true,
    batch: getCurrentBatch()
  }
];

// Mock Programs
export const mockPrograms: Program[] = [];

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
    batch: getCurrentBatch(),
    registrationDate: '2023-09-01',
    tuitionStatus: 'Paid',
    studentId: 'STU-2023-001'
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
    batch: '2022-2023',
    registrationDate: '2022-09-01',
    tuitionStatus: 'Partial',
    studentId: 'STU-2022-015'
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
    batch: getCurrentBatch(),
    registrationDate: getCurrentDate(),
    tuitionStatus: 'Unpaid',
    studentId: 'STU-2024-089'
  },
  {
    id: '4',
    firstName: 'Marie Claire',
    lastName: 'Fotso',
    nationalIdName: 'Marie Claire Fotso Nkomo',
    gender: 'Female',
    placeOfBirth: 'Bafoussam, Cameroon',
    dateOfBirth: '2001-03-12',
    motherName: 'Beatrice Fotso',
    fatherName: 'Paul Nkomo',
    address: 'Mendong, Yaoundé',
    phoneNumber: '+237 677 654 321',
    email: 'marie.fotso@student.unhimas.edu.cm',
    program: mockPrograms[3],
    department: mockDepartments[1],
    session: 'Day',
    level: 2,
    batch: '2023-2024',
    registrationDate: '2023-09-01',
    tuitionStatus: 'Paid',
    studentId: 'STU-2023-045'
  },
  {
    id: '5',
    firstName: 'Jean Baptiste',
    lastName: 'Nkomo',
    nationalIdName: 'Jean Baptiste Nkomo Mbarga',
    gender: 'Male',
    placeOfBirth: 'Garoua, Cameroon',
    dateOfBirth: '2000-11-08',
    motherName: 'Francine Nkomo',
    fatherName: 'Andre Mbarga',
    address: 'Warda, Garoua',
    phoneNumber: '+237 677 543 210',
    email: 'jean.nkomo@student.unhimas.edu.cm',
    program: mockPrograms[4],
    department: mockDepartments[2],
    session: 'Day',
    level: 1,
    batch: getCurrentBatch(),
    registrationDate: getCurrentDate(),
    tuitionStatus: 'Partial',
    studentId: 'STU-2024-156'
  },
  {
    id: '6',
    firstName: 'Stephanie',
    lastName: 'Mvondo',
    nationalIdName: 'Stephanie Mvondo Biya',
    gender: 'Female',
    placeOfBirth: 'Kribi, Cameroon',
    dateOfBirth: '2002-01-25',
    motherName: 'Claudine Mvondo',
    fatherName: 'Robert Biya',
    address: 'Essos, Yaoundé',
    phoneNumber: '+237 677 432 109',
    email: 'stephanie.mvondo@student.unhimas.edu.cm',
    program: mockPrograms[5],
    department: mockDepartments[3],
    session: 'Evening',
    level: 2,
    batch: '2023-2024',
    registrationDate: '2023-09-01',
    tuitionStatus: 'Paid',
    studentId: 'STU-2023-078'
  },
  {
    id: '7',
    firstName: 'Patrick',
    lastName: 'Kamdem',
    nationalIdName: 'Patrick Kamdem Fotso',
    gender: 'Male',
    placeOfBirth: 'Dschang, Cameroon',
    dateOfBirth: '1999-07-14',
    motherName: 'Sylvie Kamdem',
    fatherName: 'Michel Fotso',
    address: 'Cite Verte, Yaoundé',
    phoneNumber: '+237 677 321 098',
    email: 'patrick.kamdem@student.unhimas.edu.cm',
    program: mockPrograms[6],
    department: mockDepartments[4],
    session: 'Day',
    level: 1,
    batch: getCurrentBatch(),
    registrationDate: getCurrentDate(),
    tuitionStatus: 'Unpaid',
    studentId: 'STU-2024-234'
  }
];

// Mock Fee Structures
export const mockFeeStructures: FeeStructure[] = [
  {
    id: '1',
    programId: '1',
    level: 1,
    batch: getCurrentBatch(),
    tuitionFee: 450000,
    registrationFee: 25000,
    examFee: 15000,
    libraryFee: 10000,
    totalFee: 500000,
    currency: 'XAF',
    isActive: true,
    createdDate: getCurrentDate()
  },
  {
    id: '2',
    programId: '1',
    level: 2,
    batch: getCurrentBatch(),
    tuitionFee: 475000,
    registrationFee: 25000,
    examFee: 15000,
    libraryFee: 10000,
    totalFee: 525000,
    currency: 'XAF',
    isActive: true,
    createdDate: getCurrentDate()
  },
  {
    id: '3',
    programId: '2',
    level: 1,
    batch: getCurrentBatch(),
    tuitionFee: 500000,
    registrationFee: 30000,
    examFee: 20000,
    libraryFee: 15000,
    totalFee: 565000,
    currency: 'XAF',
    isActive: true,
    createdDate: getCurrentDate()
  },
  {
    id: '4',
    programId: '2',
    level: 2,
    batch: getCurrentBatch(),
    tuitionFee: 525000,
    registrationFee: 30000,
    examFee: 20000,
    libraryFee: 15000,
    totalFee: 590000,
    currency: 'XAF',
    isActive: true,
    createdDate: getCurrentDate()
  },
  {
    id: '5',
    programId: '3',
    level: 1,
    batch: getCurrentBatch(),
    tuitionFee: 425000,
    registrationFee: 25000,
    examFee: 15000,
    libraryFee: 10000,
    totalFee: 475000,
    currency: 'XAF',
    isActive: true,
    createdDate: getCurrentDate()
  },
  {
    id: '6',
    programId: '6',
    level: 1,
    batch: getCurrentBatch(),
    tuitionFee: 550000,
    registrationFee: 35000,
    examFee: 25000,
    libraryFee: 15000,
    totalFee: 625000,
    currency: 'XAF',
    isActive: true,
    createdDate: getCurrentDate()
  },
  {
    id: '7',
    programId: '7',
    level: 1,
    batch: getCurrentBatch(),
    tuitionFee: 750000,
    registrationFee: 50000,
    examFee: 35000,
    libraryFee: 20000,
    totalFee: 855000,
    currency: 'XAF',
    isActive: true,
    createdDate: getCurrentDate()
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
    reference: 'PAY-2024-001',
    batch: getCurrentBatch(),
    processedBy: 'Accounts Department'
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
    reference: 'PAY-2024-002',
    batch: '2022-2023',
    processedBy: 'Accounts Department'
  },
  {
    id: '3',
    studentId: '4',
    amount: 475000,
    currency: 'XAF',
    paymentMethod: 'Cash',
    paymentType: 'Tuition',
    status: 'Completed',
    paymentDate: '2024-09-20',
    reference: 'PAY-2024-003',
    batch: '2023-2024',
    processedBy: 'Accounts Department'
  },
  {
    id: '4',
    studentId: '5',
    amount: 200000,
    currency: 'XAF',
    paymentMethod: 'Bank Transfer',
    paymentType: 'Tuition',
    status: 'Completed',
    paymentDate: getCurrentDate(),
    reference: 'PAY-2024-004',
    batch: getCurrentBatch(),
    processedBy: 'Accounts Department'
  },
  {
    id: '5',
    studentId: '6',
    amount: 625000,
    currency: 'XAF',
    paymentMethod: 'Online',
    paymentType: 'Tuition',
    status: 'Completed',
    paymentDate: '2024-09-25',
    reference: 'PAY-2024-005',
    batch: '2023-2024',
    processedBy: 'Accounts Department'
  },
  {
    id: '6',
    studentId: '3',
    amount: 100000,
    currency: 'XAF',
    paymentMethod: 'Mobile Money',
    paymentType: 'Registration',
    status: 'Pending',
    paymentDate: getCurrentDate(),
    reference: 'PAY-2024-006',
    batch: getCurrentBatch(),
    processedBy: 'Accounts Department'
  },
  {
    id: '7',
    studentId: '7',
    amount: 50000,
    currency: 'XAF',
    paymentMethod: 'Cash',
    paymentType: 'Registration',
    status: 'Failed',
    paymentDate: getCurrentDate(),
    reference: 'PAY-2024-007',
    batch: getCurrentBatch(),
    processedBy: 'Accounts Department'
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
    establishedDate: '2015-01-01',
    studentCount: 856,
    staffCount: 45
  },
  {
    id: '2',
    name: 'UNHIMAS Yaoundé Branch',
    address: 'Bastos, Yaoundé',
    phoneNumber: '+237 222 234 567',
    email: 'yaounde@unhimas.edu.cm',
    manager: mockEmployees[2],
    isActive: true,
    establishedDate: '2018-09-01',
    studentCount: 234,
    staffCount: 28
  },
  {
    id: '3',
    name: 'UNHIMAS Bamenda Branch',
    address: 'Commercial Avenue, Bamenda',
    phoneNumber: '+237 233 345 678',
    email: 'bamenda@unhimas.edu.cm',
    manager: mockEmployees[1],
    isActive: false,
    establishedDate: '2020-01-15',
    studentCount: 89,
    staffCount: 12
  },
  {
    id: '4',
    name: 'UNHIMAS Bafoussam Branch',
    address: 'Tamdja, Bafoussam',
    phoneNumber: '+237 233 456 789',
    email: 'bafoussam@unhimas.edu.cm',
    manager: mockEmployees[3],
    isActive: true,
    establishedDate: '2021-06-10',
    studentCount: 156,
    staffCount: 18
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
    academicYear: getCurrentBatch(),
    batch: getCurrentBatch(),
    recordedDate: getCurrentDate(),
    recordedBy: 'Prof. Marie Nkomo'
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
    academicYear: '2022-2023',
    batch: '2022-2023',
    recordedDate: '2024-01-15',
    recordedBy: 'Prof. Marie Nkomo'
  },
  {
    id: '3',
    studentId: '1',
    courseId: '4',
    caScore: 28,
    examScore: 67,
    totalScore: 95,
    grade: 'A',
    gpa: 4.0,
    semester: 2,
    academicYear: getCurrentBatch(),
    batch: getCurrentBatch(),
    recordedDate: getCurrentDate(),
    recordedBy: 'Prof. Marie Nkomo'
  },
  {
    id: '4',
    studentId: '4',
    courseId: '3',
    caScore: 20,
    examScore: 55,
    totalScore: 75,
    grade: 'B',
    gpa: 3.0,
    semester: 1,
    academicYear: '2023-2024',
    batch: '2023-2024',
    recordedDate: '2024-01-20',
    recordedBy: 'Dr. Paul Fotso'
  },
  {
    id: '5',
    studentId: '5',
    courseId: '7',
    caScore: 18,
    examScore: 42,
    totalScore: 60,
    grade: 'C',
    gpa: 2.0,
    semester: 1,
    academicYear: getCurrentBatch(),
    batch: getCurrentBatch(),
    recordedDate: getCurrentDate(),
    recordedBy: 'Dr. Grace Biya'
  }
];

// Mock Attendance
export const mockAttendance: Attendance[] = [
  {
    id: '1',
    studentId: '1',
    courseId: '1',
    date: getCurrentDate(),
    status: 'Present',
    method: 'QR Code',
    timestamp: getCurrentDateTime(),
    batch: getCurrentBatch(),
    recordedBy: 'System'
  },
  {
    id: '2',
    studentId: '2',
    courseId: '2',
    date: getCurrentDate(),
    status: 'Late',
    method: 'Manual',
    timestamp: getCurrentDateTime(),
    batch: '2022-2023',
    recordedBy: 'Prof. Marie Nkomo'
  },
  {
    id: '3',
    studentId: '4',
    courseId: '3',
    date: getCurrentDate(),
    status: 'Present',
    method: 'QR Code',
    timestamp: getCurrentDateTime(),
    batch: '2023-2024',
    recordedBy: 'System'
  },
  {
    id: '4',
    studentId: '1',
    courseId: '4',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'Present',
    method: 'QR Code',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    batch: getCurrentBatch(),
    recordedBy: 'System'
  },
  {
    id: '5',
    studentId: '5',
    courseId: '7',
    date: getCurrentDate(),
    status: 'Absent',
    method: 'Manual',
    timestamp: getCurrentDateTime(),
    batch: getCurrentBatch(),
    recordedBy: 'Dr. Grace Biya'
  }
];

// Mock Announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Semester Examination Schedule',
    content: 'The first semester examinations will commence on January 15, 2025. All students are advised to check their examination timetables and prepare accordingly. Examination halls will be announced one week before the commencement date.',
    targetAudience: 'Students',
    targetBatch: getCurrentBatch(),
    createdBy: 'Academic Office',
    createdAt: getCurrentDateTime(),
    scheduledFor: new Date(Date.now() + 86400000).toISOString(),
    status: 'Scheduled',
    priority: 'High'
  },
  {
    id: '2',
    title: 'Fee Payment Deadline',
    content: 'All outstanding fees must be paid before December 31, 2024. Late payment will attract a fine of 25,000 XAF. Students with unpaid fees will not be allowed to sit for examinations.',
    targetAudience: 'Students',
    targetBatch: getCurrentBatch(),
    createdBy: 'Accounts Department',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    status: 'Sent',
    priority: 'High'
  },
  {
    id: '3',
    title: 'New Academic Calendar Released',
    content: 'The academic calendar for the 2025-2026 session has been released. Please check the academic office for detailed information about semester dates, holidays, and examination periods.',
    targetAudience: 'All',
    createdBy: 'Academic Office',
    createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
    status: 'Sent',
    priority: 'Medium'
  },
  {
    id: '4',
    title: 'Staff Meeting - December 20th',
    content: 'All academic and non-academic staff are required to attend the end-of-year meeting scheduled for December 20th, 2024 at 10:00 AM in the main auditorium.',
    targetAudience: 'Staff',
    createdBy: 'HR Department',
    createdAt: new Date(Date.now() - 86400000 * 11).toISOString(),
    status: 'Draft',
    priority: 'Medium'
  },
  {
    id: '5',
    title: 'Library Extended Hours',
    content: 'The library will be open 24/7 during the examination period (January 10-30, 2025) to provide students with adequate study space and resources.',
    targetAudience: 'Students',
    targetBatch: getCurrentBatch(),
    createdBy: 'Library',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    scheduledFor: new Date(Date.now() + 86400000 * 4).toISOString(),
    status: 'Scheduled',
    priority: 'Low'
  }
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: '1',
    title: 'Welcome to New Semester',
    content: 'Welcome back to UNHIMAS! We wish you a successful academic year.',
    type: 'SMS',
    targetAudience: 'Students',
    targetBatch: getCurrentBatch(),
    recipients: 1247,
    status: 'Sent',
    scheduledFor: '2024-09-01T08:00:00Z',
    createdBy: 'Admin',
    createdAt: '2024-08-30T10:00:00Z',
    sentAt: '2024-09-01T08:00:00Z'
  },
  {
    id: '2',
    title: 'Fee Payment Reminder',
    content: 'Dear student, this is a reminder that your tuition fee payment is due. Please make payment to avoid late fees.',
    type: 'Email',
    targetAudience: 'Students',
    targetBatch: getCurrentBatch(),
    recipients: 156,
    status: 'Sent',
    scheduledFor: '2024-11-15T09:00:00Z',
    createdBy: 'Accounts',
    createdAt: '2024-11-14T15:00:00Z',
    sentAt: '2024-11-15T09:00:00Z'
  },
  {
    id: '3',
    title: 'Exam Timetable Available',
    content: 'Your examination timetable is now available. Please check the student portal for details.',
    type: 'SMS',
    targetAudience: 'Students',
    targetBatch: getCurrentBatch(),
    recipients: 1247,
    status: 'Scheduled',
    scheduledFor: new Date(Date.now() + 86400000 * 4).toISOString(),
    createdBy: 'Academic Office',
    createdAt: getCurrentDateTime()
  }
];

// Mock Roles
export const mockRoles: Role[] = [
  {
    id: '1',
    name: 'SuperAdmin',
    description: 'Full system access and control',
    permissions: ['all'],
    isActive: true,
    createdDate: '2020-01-01'
  },
  {
    id: '2',
    name: 'Admin',
    description: 'Administrative access to most features',
    permissions: ['students', 'fees', 'reports', 'announcements', 'branches'],
    isActive: true,
    createdDate: '2020-01-01'
  },
  {
    id: '3',
    name: 'Lecturer',
    description: 'Access to academic features and student records',
    permissions: ['students', 'grades', 'attendance', 'courses'],
    isActive: true,
    createdDate: '2020-01-01'
  },
  {
    id: '4',
    name: 'Accountant',
    description: 'Access to financial features',
    permissions: ['fees', 'payments', 'financial_reports', 'accounting'],
    isActive: true,
    createdDate: '2020-01-01'
  },
  {
    id: '5',
    name: 'Dean of Studies',
    description: 'Academic oversight and management',
    permissions: ['students', 'courses', 'programs', 'academic_reports', 'grades'],
    isActive: true,
    createdDate: '2020-01-01'
  },
  {
    id: '6',
    name: 'Head Of Department',
    description: 'Department-specific management',
    permissions: ['department_students', 'department_courses', 'department_reports', 'grades'],
    isActive: true,
    createdDate: '2020-01-01'
  }
];

// Mock Permissions
export const mockPermissions: Permission[] = [
  { id: '1', name: 'students', description: 'Manage student records', category: 'Academic' },
  { id: '2', name: 'fees', description: 'Manage fee structures and payments', category: 'Financial' },
  { id: '3', name: 'courses', description: 'Manage courses and curriculum', category: 'Academic' },
  { id: '4', name: 'grades', description: 'Manage student grades and assessments', category: 'Academic' },
  { id: '5', name: 'attendance', description: 'Manage attendance records', category: 'Academic' },
  { id: '6', name: 'reports', description: 'Generate and view reports', category: 'Analytics' },
  { id: '7', name: 'announcements', description: 'Create and manage announcements', category: 'Communication' },
  { id: '8', name: 'payments', description: 'Process and track payments', category: 'Financial' },
  { id: '9', name: 'programs', description: 'Manage academic programs', category: 'Academic' },
  { id: '10', name: 'financial_reports', description: 'View financial reports', category: 'Financial' },
  { id: '11', name: 'academic_reports', description: 'View academic reports', category: 'Academic' },
  { id: '12', name: 'department_students', description: 'Manage department students', category: 'Academic' },
  { id: '13', name: 'department_courses', description: 'Manage department courses', category: 'Academic' },
  { id: '14', name: 'department_reports', description: 'View department reports', category: 'Academic' },
  { id: '15', name: 'branches', description: 'Manage school branches', category: 'Administrative' },
  { id: '16', name: 'accounting', description: 'Office accounting management', category: 'Financial' },
  { id: '17', name: 'all', description: 'Full system access', category: 'System' }
];

// Mock Admission Applications
export const mockAdmissionApplications: AdmissionApplication[] = [
  {
    id: '1',
    applicantName: 'Jean Baptiste Nkomo',
    email: 'jean.nkomo@email.com',
    phoneNumber: '+237 677 123 456',
    programId: '2',
    documents: ['Transcript', 'ID Copy', 'Photo'],
    status: 'Pending',
    applicationDate: getCurrentDate(),
    batch: getCurrentBatch(),
    feesPaid: true,
    comments: 'All documents submitted'
  },
  {
    id: '2',
    applicantName: 'Marie Claire Fotso',
    email: 'marie.fotso@email.com',
    phoneNumber: '+237 677 234 567',
    programId: '3',
    documents: ['Transcript', 'ID Copy', 'Photo', 'Birth Certificate'],
    status: 'Approved',
    applicationDate: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
    batch: getCurrentBatch(),
    feesPaid: true,
    reviewedBy: 'Dr. Christine Mvondo',
    reviewDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    comments: 'Excellent academic record'
  },
  {
    id: '3',
    applicantName: 'Paul Mbarga',
    email: 'paul.mbarga@email.com',
    phoneNumber: '+237 677 345 678',
    programId: '7',
    documents: ['Transcript', 'ID Copy'],
    status: 'Rejected',
    applicationDate: new Date(Date.now() - 86400000 * 13).toISOString().split('T')[0],
    batch: getCurrentBatch(),
    feesPaid: false,
    reviewedBy: 'Dr. Christine Mvondo',
    reviewDate: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
    comments: 'Incomplete documentation'
  }
];

// Mock Office Accounts
export const mockOfficeAccounts: OfficeAccount[] = [
  {
    id: '1',
    type: 'Income',
    category: 'Fee Collection',
    amount: 2450000,
    description: 'Student tuition fees - December 2024',
    date: getCurrentDate(),
    reference: 'INC-2024-001',
    createdBy: 'Accounts Department',
    batch: getCurrentBatch(),
    status: 'Approved',
    approvedBy: 'Dr. Christine Mvondo'
  },
  {
    id: '2',
    type: 'Expense',
    category: 'Staff Salaries',
    amount: 1250000,
    description: 'Monthly staff salaries - December 2024',
    date: getCurrentDate(),
    reference: 'EXP-2024-001',
    createdBy: 'HR Department',
    batch: getCurrentBatch(),
    status: 'Approved',
    approvedBy: 'Dr. Christine Mvondo'
  },
  {
    id: '3',
    type: 'Income',
    category: 'Registration Fees',
    amount: 350000,
    description: 'New student registration fees',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    reference: 'INC-2024-002',
    createdBy: 'Admissions Office',
    batch: getCurrentBatch(),
    status: 'Approved'
  },
  {
    id: '4',
    type: 'Expense',
    category: 'Utilities',
    amount: 185000,
    description: 'Electricity and water bills',
    date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    reference: 'EXP-2024-002',
    createdBy: 'Admin Office',
    batch: getCurrentBatch(),
    status: 'Pending'
  },
  {
    id: '5',
    type: 'Expense',
    category: 'Equipment',
    amount: 450000,
    description: 'Computer lab equipment purchase',
    date: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    reference: 'EXP-2024-003',
    createdBy: 'IT Department',
    batch: getCurrentBatch(),
    status: 'Approved',
    approvedBy: 'Dr. Christine Mvondo'
  }
];

// Helper functions
export const getCurrentBatchData = () => mockBatches.find(b => b.isActive);
export const getStudentsByBatch = (batch: string) => mockStudents.filter(s => s.batch === batch);
export const getPaymentsByBatch = (batch: string) => mockPayments.filter(p => p.batch === batch);
export const getGradesByBatch = (batch: string) => mockGrades.filter(g => g.batch === batch);
export const getAttendanceByBatch = (batch: string) => mockAttendance.filter(a => a.batch === batch);