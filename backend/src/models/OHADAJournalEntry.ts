import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter';

export interface IOHADAJournalLine {
  account: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
  analyticalCode?: string;
}

export interface IOHADAJournalEntry extends Document {
  entryNumber: string; // Sequential journal entry number
  date: Date;
  reference: string; // External reference (invoice, receipt, etc.)
  description: string;
  lines: IOHADAJournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'reversed';
  reversalEntry?: mongoose.Types.ObjectId;
  attachments?: string[];
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  branch: mongoose.Types.ObjectId;
  period: string; // Accounting period (YYYY-MM)
  createdAt: Date;
  updatedAt: Date;
}

const OHADAJournalLineSchema = new Schema<IOHADAJournalLine>({
  account: { type: Schema.Types.ObjectId, ref: 'OHADAAccount', required: true },
  accountCode: { type: String, required: true },
  accountName: { type: String, required: true },
  debit: { type: Number, required: true, default: 0, min: 0 },
  credit: { type: Number, required: true, default: 0, min: 0 },
  description: { type: String },
  reference: { type: String },
  analyticalCode: { type: String }
}, { _id: false });

const OHADAJournalEntrySchema: Schema = new Schema({
  entryNumber: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  reference: { type: String, required: true },
  description: { type: String, required: true },
  lines: [OHADAJournalLineSchema],
  totalDebit: { type: Number, required: true, default: 0 },
  totalCredit: { type: Number, required: true, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'posted', 'reversed'], 
    default: 'draft' 
  },
  reversalEntry: { type: Schema.Types.ObjectId, ref: 'OHADAJournalEntry' },
  attachments: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  period: { type: String, required: true, match: /^\d{4}-\d{2}$/ }
}, { timestamps: true });

// Generate entry number before saving
OHADAJournalEntrySchema.pre<IOHADAJournalEntry>('save', async function(next) {
  if (this.isNew && !this.entryNumber) {
    try {
      const year = new Date(this.date).getFullYear();
      const counter = await Counter.findByIdAndUpdate(
        { _id: `journalEntry-${year}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.entryNumber = `JE${year}${counter.seq.toString().padStart(6, '0')}`;
    } catch (error: any) {
      return next(error);
    }
  }

  // Calculate totals
  this.totalDebit = this.lines.reduce((sum, line) => sum + line.debit, 0);
  this.totalCredit = this.lines.reduce((sum, line) => sum + line.credit, 0);

  // Set accounting period
  this.period = `${new Date(this.date).getFullYear()}-${(new Date(this.date).getMonth() + 1).toString().padStart(2, '0')}`;

  next();
});

// Validate that debits equal credits
OHADAJournalEntrySchema.pre<IOHADAJournalEntry>('save', function(next) {
  if (this.lines.length === 0) {
    return next(new Error('Journal entry must have at least one line'));
  }

  const totalDebits = this.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = this.lines.reduce((sum, line) => sum + line.credit, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return next(new Error('Debits must equal credits'));
  }

  next();
});

// Indexes for efficient queries
OHADAJournalEntrySchema.index({ entryNumber: 1 });
OHADAJournalEntrySchema.index({ date: 1 });
OHADAJournalEntrySchema.index({ period: 1 });
OHADAJournalEntrySchema.index({ status: 1 });
OHADAJournalEntrySchema.index({ branch: 1, period: 1 });
OHADAJournalEntrySchema.index({ reference: 1 });

export default mongoose.model<IOHADAJournalEntry>('OHADAJournalEntry', OHADAJournalEntrySchema);