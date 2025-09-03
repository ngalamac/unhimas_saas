import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  type: 'income' | 'expense';
  description?: string;
  createdAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICategory>('Category', CategorySchema);
