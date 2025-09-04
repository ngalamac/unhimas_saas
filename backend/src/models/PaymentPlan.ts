import mongoose, { Schema } from 'mongoose';

const PaymentPlanSchema = new Schema({
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  description: { type: String },
  // optional due date for this plan (helpful when used as an installment)
  dueDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('PaymentPlan', PaymentPlanSchema);
