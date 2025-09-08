import mongoose, { Schema, Document } from 'mongoose';

// This interface defines a single line in a journal entry (a debit or a credit)
export interface IJournalEntryLine {
  account: mongoose.Types.ObjectId; // Reference to the Account model
  debit: number;
  credit: number;
  description?: string;
}

// This interface defines the complete journal entry
export interface IJournalEntry extends Document {
  date: Date;
  description: string;
  lines: IJournalEntryLine[];
  branch: mongoose.Types.ObjectId; // Reference to the Branch model
  transactionRef?: mongoose.Types.ObjectId; // Optional reference to the original transaction (e.g., OfficeTransaction)
  transactionModel?: string; // The model name of the referenced transaction
  createdBy: mongoose.Types.ObjectId; // Reference to the User model
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntryLineSchema = new Schema({
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  description: { type: String }
}, { _id: false });

const JournalEntrySchema: Schema = new Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  lines: [JournalEntryLineSchema],
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  transactionRef: { type: Schema.Types.ObjectId, required: false },
  transactionModel: { type: String, required: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Pre-save hook to validate that debits equal credits
JournalEntrySchema.pre('save', function(next) {
  const totalDebits = this.lines.reduce((sum: number, line: IJournalEntryLine) => sum + (line.debit || 0), 0);
  const totalCredits = this.lines.reduce((sum: number, line: IJournalEntryLine) => sum + (line.credit || 0), 0);

  // Use a small tolerance for floating point comparisons
  if (Math.abs(totalDebits - totalCredits) > 1e-9) {
    const err = new Error('Debits must equal credits');
    return next(err);
  }
  next();
});

// Indexes for performance
JournalEntrySchema.index({ date: 1 });
JournalEntrySchema.index({ branch: 1 });
JournalEntrySchema.index({ 'lines.account': 1 });

export default mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
