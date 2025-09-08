import mongoose, { Schema } from 'mongoose';

const TuitionTransactionSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XAF' },
  method: { type: String },
  notes: { type: String },
  isAdvance: { type: Boolean, default: false },
  expectedAmount: { type: Number, required: false },
  installmentKey: { type: String }, // which installment this payment is for (can be null for advances)
  appliedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

TuitionTransactionSchema.index({ student: 1 });

export default mongoose.model('TuitionTransaction', TuitionTransactionSchema);
