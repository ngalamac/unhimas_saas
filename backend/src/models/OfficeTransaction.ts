import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  category: string; // category name
  amount: number;
  date: Date;
  registeredBy: mongoose.Types.ObjectId; // User who created the transaction
  branch: mongoose.Types.ObjectId; // Branch this transaction belongs to
  linkedStudent?: mongoose.Types.ObjectId;
  linkedStaff?: mongoose.Types.ObjectId;
  description?: string;
  reference?: string; // External reference number
  paymentMethod?: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';
  attachments?: string[]; // File URLs for receipts/invoices
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId; // User who approved the transaction
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  linkedStudent: { type: Schema.Types.ObjectId, ref: 'Student', required: false },
  linkedStaff: { type: Schema.Types.ObjectId, ref: 'Staff', required: false },
  description: { type: String },
  reference: { type: String },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'],
    default: 'cash'
  },
  attachments: [{ type: String }],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  approvedAt: { type: Date }
}, { timestamps: true });

// Indexes for efficient queries
TransactionSchema.index({ branch: 1, date: -1 });
TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ registeredBy: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ date: -1 });

export default mongoose.model<ITransaction>('OfficeTransaction', TransactionSchema);
