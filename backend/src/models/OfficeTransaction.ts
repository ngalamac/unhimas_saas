import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  category: string; // category name
  amount: number;
  date: Date;
  registeredBy: mongoose.Types.ObjectId; // User
  linkedStudent?: mongoose.Types.ObjectId;
  linkedStaff?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  linkedStudent: { type: Schema.Types.ObjectId, ref: 'Student', required: false },
  linkedStaff: { type: Schema.Types.ObjectId, ref: 'Staff', required: false },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('OfficeTransaction', TransactionSchema);
