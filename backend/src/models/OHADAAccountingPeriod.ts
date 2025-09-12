import mongoose, { Schema, Document } from 'mongoose';

export interface IOHADAAccountingPeriod extends Document {
  year: number;
  startDate: Date;
  endDate: Date;
  status: 'open' | 'closed' | 'locked';
  branch: mongoose.Types.ObjectId;
  openingBalances: Array<{
    accountCode: string;
    debitBalance: number;
    creditBalance: number;
  }>;
  closingBalances: Array<{
    accountCode: string;
    debitBalance: number;
    creditBalance: number;
  }>;
  closingEntries?: mongoose.Types.ObjectId[]; // Journal entries for period closing
  createdBy: mongoose.Types.ObjectId;
  closedBy?: mongoose.Types.ObjectId;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BalanceSchema = new Schema({
  accountCode: { type: String, required: true },
  debitBalance: { type: Number, default: 0 },
  creditBalance: { type: Number, default: 0 }
}, { _id: false });

const OHADAAccountingPeriodSchema: Schema = new Schema({
  year: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['open', 'closed', 'locked'], 
    default: 'open' 
  },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  openingBalances: [BalanceSchema],
  closingBalances: [BalanceSchema],
  closingEntries: [{ type: Schema.Types.ObjectId, ref: 'OHADAJournalEntry' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  closedAt: { type: Date }
}, { timestamps: true });

// Ensure unique period per branch per year
OHADAAccountingPeriodSchema.index({ branch: 1, year: 1 }, { unique: true });
OHADAAccountingPeriodSchema.index({ status: 1 });
OHADAAccountingPeriodSchema.index({ year: 1 });

export default mongoose.model<IOHADAAccountingPeriod>('OHADAAccountingPeriod', OHADAAccountingPeriodSchema);