import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  reference?: string;
  createdBy?: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  reference: { type: String, required: false },
  createdBy: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
