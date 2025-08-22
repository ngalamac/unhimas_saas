import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  type: string;
  permissions: Record<string, Record<string, boolean>>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, required: true },
  permissions: { type: Object, default: {} },
});

export default mongoose.model<IUser>('User', UserSchema);
