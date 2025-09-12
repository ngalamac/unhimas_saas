export interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  names: string;
  email: string;
  phoneNumber: string;
  employeeId: string;
  department: string;
  position: string;
  type: 'Lecturer' | 'Accountant' | 'Dean of Studies' | 'Head Of Department' | 'Admin';
  isActive: boolean;
  hireDate: string;
  hourlyRate: number; // Pay per hour in XAF
  baseSalary?: number; // Fixed monthly salary for non-hourly staff
  paymentType: 'hourly' | 'fixed'; // How they are paid
  branch: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeachingSession {
  _id: string;
  lecturer: StaffMember | string;
  course: {
    _id: string;
    code: string;
    title: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  status: 'pending' | 'approved' | 'rejected';
  signedAt: string;
  approvedBy?: StaffMember | string;
  notes?: string;
  branch: string;
  createdAt: string;
}

export interface PayrollPeriod {
  _id: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'processing' | 'completed' | 'paid';
  totalAmount: number;
  staffCount: number;
  createdBy: string;
  processedAt?: string;
  paidAt?: string;
  branch: string;
  createdAt: string;
}

export interface PayrollEntry {
  _id: string;
  payrollPeriod: PayrollPeriod | string;
  staff: StaffMember | string;
  hoursWorked: number;
  hourlyRate: number;
  baseSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  grossSalary: number;
  deductions: {
    tax: number;
    insurance: number;
    other: number;
    total: number;
  };
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface PayrollSummary {
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalStaff: number;
  averageSalary: number;
  byDepartment: Array<{
    department: string;
    staffCount: number;
    totalSalary: number;
  }>;
  byPaymentType: Array<{
    type: 'hourly' | 'fixed';
    staffCount: number;
    totalSalary: number;
  }>;
}