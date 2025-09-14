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
  // Optional linkage to a student tuition context
  student?: mongoose.Types.ObjectId; // Ref: Student
  tuitionTransaction?: mongoose.Types.ObjectId; // Ref: TuitionTransaction
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
  analyticalCode: { type: String },
  student: { type: Schema.Types.ObjectId, ref: 'Student' },
  tuitionTransaction: { type: Schema.Types.ObjectId, ref: 'TuitionTransaction' }
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

// Prepare derived fields & validate before schema required validators fire
OHADAJournalEntrySchema.pre<IOHADAJournalEntry>('validate', async function(next) {
  try {
    if (!this.date) {
      return next(); // let required validator for date handle it
    }

    // Period (YYYY-MM) derived early so required validator passes
    if (!this.period) {
      this.period = `${new Date(this.date).getFullYear()}-${(new Date(this.date).getMonth() + 1).toString().padStart(2, '0')}`;
    }

    // Totals (ensure present for required)
    this.totalDebit = this.lines?.reduce((sum, line) => sum + line.debit, 0) || 0;
    this.totalCredit = this.lines?.reduce((sum, line) => sum + line.credit, 0) || 0;

    // Basic line presence
    if (!this.lines || this.lines.length === 0) {
      return next(new Error('Journal entry must have at least one line'));
    }

    // Balance validation
    if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
      return next(new Error('Debits must equal credits'));
    }

    // Generate entry number once per new doc
    if (this.isNew && !this.entryNumber) {
      const year = new Date(this.date).getFullYear();
      const counter = await Counter.findByIdAndUpdate(
        { _id: `journalEntry-${year}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.entryNumber = `JE${year}${counter.seq.toString().padStart(6, '0')}`;
    }

    next();
  } catch (err) {
    next(err as any);
  }
});

// Indexes for efficient queries
OHADAJournalEntrySchema.index({ entryNumber: 1 });
OHADAJournalEntrySchema.index({ date: 1 });
OHADAJournalEntrySchema.index({ period: 1 });
OHADAJournalEntrySchema.index({ status: 1 });
OHADAJournalEntrySchema.index({ branch: 1, period: 1 });
OHADAJournalEntrySchema.index({ reference: 1 });
// Enable quick lookups for student-linked accounting lines
OHADAJournalEntrySchema.index({ 'lines.student': 1 });
OHADAJournalEntrySchema.index({ 'lines.tuitionTransaction': 1 });

export default mongoose.model<IOHADAJournalEntry>('OHADAJournalEntry', OHADAJournalEntrySchema);