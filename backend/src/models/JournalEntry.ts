import mongoose, { Schema, Document, Types } from 'mongoose';

interface IJournalLine {
    account: Types.ObjectId;
    debit: number;
    credit: number;
    description?: string;
}

export interface IJournalEntry extends Document {
    branch: Types.ObjectId;
    date: Date;
    memo: string;
    lines: IJournalLine[];
    status: 'pending' | 'approved' | 'rejected';
    createdBy: Types.ObjectId;
    approvedBy?: Types.ObjectId;
    rejectionReason?: string;
    relatedDocument?: {
        model: string;
        docId: Types.ObjectId;
    };
    currency: string;
}

const JournalLineSchema = new Schema<IJournalLine>({
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    debit: { type: Number, required: true, default: 0 },
    credit: { type: Number, required: true, default: 0 },
    description: String,
});

const JournalEntrySchema = new Schema<IJournalEntry>({
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    date: { type: Date, required: true, default: Date.now },
    memo: { type: String, required: true },
    lines: [JournalLineSchema],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
    relatedDocument: {
        model: String,
        docId: Schema.Types.ObjectId
    },
    currency: { type: String, required: true, default: 'XAF' },
}, { timestamps: true });

// Ensure debits and credits are not negative
JournalLineSchema.path('debit').validate((value: number) => value >= 0, 'Debit amount cannot be negative.');
JournalLineSchema.path('credit').validate((value: number) => value >= 0, 'Credit amount cannot be negative.');

// Ensure at least one line and that the entry is balanced
JournalEntrySchema.pre('save', function(next) {
    if (this.isNew) {
        if (this.lines.length === 0) {
            return next(new Error('Journal entry must have at least one line.'));
        }

        const totalDebits = this.lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredits = this.lines.reduce((sum, line) => sum + line.credit, 0);

        // Use a small tolerance for floating point comparisons
        if (Math.abs(totalDebits - totalCredits) > 0.001) {
            return next(new Error('Debits and credits must be balanced.'));
        }
    }


    next();
});

const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);

export default JournalEntry;
