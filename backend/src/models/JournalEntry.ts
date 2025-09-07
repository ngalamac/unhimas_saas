import mongoose, { Schema, Document } from 'mongoose';

interface IJournalLine {
  account: mongoose.Types.ObjectId; // Reference to an Account
  debit: number;
  credit: number;
  description?: string;
}

export interface IJournalEntry extends Document {
  date: Date;
  memo: string; // A description of the transaction
  lines: IJournalLine[];
  branch: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JournalLineSchema: Schema = new Schema({
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  description: { type: String },
}, { _id: false });

const JournalEntrySchema: Schema = new Schema({
  date: { type: Date, required: true },
  memo: { type: String, required: true },
  lines: {
    type: [JournalLineSchema],
    validate: [
      (lines: IJournalLine[]) => lines.length >= 2,
      'A journal entry must have at least two lines.'
    ]
  },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', required: true, index: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Validate that debits equal credits
JournalEntrySchema.pre('save', function(next) {
  const totalDebits = this.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = this.lines.reduce((sum, line) => sum + line.credit, 0);
  if (Math.abs(totalDebits - totalCredits) > 1e-6) { // Use a tolerance for floating point comparisons
    return next(new Error('Debits must equal credits.'));
  }
  next();
});

export default mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
