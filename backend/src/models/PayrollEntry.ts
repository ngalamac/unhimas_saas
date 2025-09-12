import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollEntry extends Document {
  payrollPeriod: mongoose.Types.ObjectId;
  staff: mongoose.Types.ObjectId;
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
  paymentDate?: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollEntrySchema: Schema = new Schema({
  payrollPeriod: { type: Schema.Types.ObjectId, ref: 'PayrollPeriod', required: true },
  staff: { type: Schema.Types.ObjectId, ref: 'StaffMember', required: true },
  hoursWorked: { type: Number, required: true, min: 0 },
  hourlyRate: { type: Number, required: true, min: 0 },
  baseSalary: { type: Number, default: 0, min: 0 },
  overtimeHours: { type: Number, default: 0, min: 0 },
  overtimeRate: { type: Number, default: 0, min: 0 },
  grossSalary: { type: Number, required: true, min: 0 },
  deductions: {
    tax: { type: Number, default: 0, min: 0 },
    insurance: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  netSalary: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'approved', 'paid'], 
    default: 'draft' 
  },
  paymentDate: { type: Date },
  paymentMethod: { type: String },
  notes: { type: String }
}, { timestamps: true });

// Calculate totals before saving
PayrollEntrySchema.pre<IPayrollEntry>('save', function(next) {
  // Calculate gross salary
  const regularPay = this.hoursWorked * this.hourlyRate;
  const overtimePay = this.overtimeHours * this.overtimeRate;
  this.grossSalary = regularPay + overtimePay + this.baseSalary;
  
  // Calculate total deductions
  this.deductions.total = this.deductions.tax + this.deductions.insurance + this.deductions.other;
  
  // Calculate net salary
  this.netSalary = this.grossSalary - this.deductions.total;
  
  next();
});

// Ensure unique payroll entry per staff per period
PayrollEntrySchema.index({ payrollPeriod: 1, staff: 1 }, { unique: true });
PayrollEntrySchema.index({ staff: 1 });
PayrollEntrySchema.index({ status: 1 });

export default mongoose.model<IPayrollEntry>('PayrollEntry', PayrollEntrySchema);