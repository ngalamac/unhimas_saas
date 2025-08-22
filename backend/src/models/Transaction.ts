import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date;
  source: 'Tuition' | 'Fees' | 'Other Income' | 'Expense';
}

const TransactionSchema: Schema = new Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  source: { type: String, enum: ['Tuition', 'Fees', 'Other Income', 'Expense'], required: true },
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
