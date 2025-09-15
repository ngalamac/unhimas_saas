export interface TuitionStructure {
  _id: string;
  name: string;
  program: {
    _id: string;
    name: string;
  };
  department: {
    _id: string;
    name: string;
  };
  level: number;
  academicYear: string;
  installments: TuitionInstallment[];
  totalAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TuitionInstallment {
  key: string;
  label: string;
  amount: number;
  dueDate: string;
  ohadaAccountCode: string; // OHADA account to credit when paid
  ohadaAccountName: string;
  isRequired: boolean;
  order: number;
}

export interface StudentTuitionRecord {
  _id: string;
  student: {
    _id: string;
    studentId: string;
    names: string;
  };
  tuitionStructure: TuitionStructure;
  installmentStatus: Array<{
    installmentKey: string;
    label: string;
    targetAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
    dueDate: string;
    lastPaymentDate?: string;
    ohadaAccountCode: string;
    remindersSent: number;
    lastReminderDate?: string;
  }>;
  totalTargetAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  overallStatus: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
  paymentHistory: TuitionPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface TuitionPayment {
  _id: string;
  student: string;
  installmentKey: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'online';
  reference?: string;
  notes?: string;
  registeredBy: {
    _id: string;
    name: string;
  };
  ohadaJournalEntry: string; // Reference to OHADA journal entry
  branch: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface TuitionReminder {
  _id: string;
  student: string;
  installmentKey: string;
  reminderType: 'due_soon' | 'overdue' | 'final_notice';
  sentDate: string;
  emailSent: boolean;
  smsSent: boolean;
  nextReminderDate?: string;
}