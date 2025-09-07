import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  reference?: string;
  createdBy?: { id?: string; name?: string; email?: string } | string;
  staffId?: mongoose.Types.ObjectId | string;
  studentId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  reference: { type: String, required: false },
  // createdBy can be a simple string (legacy) or an object { id, name, email }
  createdBy: { type: Schema.Types.Mixed, required: false },
  // optional references to staff or student records
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: false },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
