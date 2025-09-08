import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  type: 'income' | 'expense';
  account: mongoose.Types.ObjectId; // The accounting account to use for this category
  description?: string;
  parent?: mongoose.Types.ObjectId; // For subcategories
  isActive: boolean;
  branch?: mongoose.Types.ObjectId; // Branch-specific categories (optional for global categories)
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  description: { type: String },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', required: false },
  isActive: { type: Boolean, default: true },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes for efficient queries
CategorySchema.index({ name: 1, type: 1 });
CategorySchema.index({ type: 1 });
CategorySchema.index({ branch: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ parent: 1 });

export default mongoose.model<ICategory>('Category', CategorySchema);