import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  staffId: mongoose.Types.ObjectId;
  amount: number;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema: Schema = new Schema({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  amount: { type: Number, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
