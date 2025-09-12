import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollPeriod extends Document {
  month: number; // 1-12
  year: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'processing' | 'completed' | 'paid';
  totalAmount: number;
  staffCount: number;
  createdBy: mongoose.Types.ObjectId;
  processedAt?: Date;
  paidAt?: Date;
  branch: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollPeriodSchema: Schema = new Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, min: 2020 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'processing', 'completed', 'paid'], 
    default: 'draft' 
  },
  totalAmount: { type: Number, default: 0, min: 0 },
  staffCount: { type: Number, default: 0, min: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  processedAt: { type: Date },
  paidAt: { type: Date },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  notes: { type: String }
}, { timestamps: true });

// Ensure unique payroll period per branch per month/year
PayrollPeriodSchema.index({ branch: 1, month: 1, year: 1 }, { unique: true });
PayrollPeriodSchema.index({ status: 1 });
PayrollPeriodSchema.index({ branch: 1, status: 1 });

export default mongoose.model<IPayrollPeriod>('PayrollPeriod', PayrollPeriodSchema);