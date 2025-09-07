import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  manager: mongoose.Types.ObjectId; // User ID of the branch manager
  isActive: boolean;
  establishedDate: Date;
  studentCount: number;
  staffCount: number;
  description?: string;
  location?: {
    city: string;
    region: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  settings?: {
    timezone: string;
    currency: string;
    academicYear: string;
  };
  createdBy: mongoose.Types.ObjectId; // SuperAdmin who created this branch
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, minlength: 2 },
  address: { type: String, required: true, trim: true },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number']
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  establishedDate: { type: Date, required: true },
  studentCount: { type: Number, default: 0 },
  staffCount: { type: Number, default: 0 },
  description: { type: String },
  location: {
    city: { type: String },
    region: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  settings: {
    timezone: { type: String, default: 'Africa/Douala' },
    currency: { type: String, default: 'XAF' },
    academicYear: { type: String, default: '2024-2025' }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes for efficient queries
BranchSchema.index({ name: 1 });
BranchSchema.index({ manager: 1 });
BranchSchema.index({ isActive: 1 });
BranchSchema.index({ createdBy: 1 });

export default mongoose.model<IBranch>('Branch', BranchSchema);
