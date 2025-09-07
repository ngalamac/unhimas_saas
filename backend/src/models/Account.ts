import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
  name: string;
  code?: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  description?: string;
  parent?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AccountSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: false },
  type: { type: String, enum: ['asset', 'liability', 'equity', 'income', 'expense'], required: true },
  description: { type: String },
  parent: { type: Schema.Types.ObjectId, ref: 'Account', required: false },
  createdAt: { type: Date, default: Date.now }
});

AccountSchema.index({ name: 1 });
AccountSchema.index({ code: 1 });
AccountSchema.index({ type: 1 });

export default mongoose.model<IAccount>('Account', AccountSchema);
