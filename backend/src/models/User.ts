import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'branch_manager' | 'user';
  branches: mongoose.Types.ObjectId[]; // Branch IDs
  permissions: Record<string, Record<string, boolean>>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'branch_manager', 'user'], required: true },
  branches: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
  permissions: { type: Object, default: {} },
});

export default mongoose.model<IUser>('User', UserSchema);
