import mongoose, { Schema, Document } from 'mongoose';

export interface ITeachingSession extends Document {
  lecturer: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  date: Date;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  hoursWorked: number;
  status: 'pending' | 'approved' | 'rejected';
  signedAt: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  branch: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeachingSessionSchema: Schema = new Schema({
  lecturer: { type: Schema.Types.ObjectId, ref: 'StaffMember', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  endTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  hoursWorked: { type: Number, required: true, min: 0, max: 24 },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  signedAt: { type: Date, default: Date.now },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  notes: { type: String },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true }
}, { timestamps: true });

// Calculate hours worked from start and end time
TeachingSessionSchema.pre<ITeachingSession>('save', function(next) {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
      // Handle sessions that cross midnight
      diffMinutes += 24 * 60;
    }
    
    this.hoursWorked = Math.round((diffMinutes / 60) * 100) / 100; // Round to 2 decimal places
  }
  next();
});

// Indexes for efficient queries
TeachingSessionSchema.index({ lecturer: 1, date: 1 });
TeachingSessionSchema.index({ course: 1, date: 1 });
TeachingSessionSchema.index({ branch: 1, date: 1 });
TeachingSessionSchema.index({ status: 1 });
TeachingSessionSchema.index({ date: 1 });

export default mongoose.model<ITeachingSession>('TeachingSession', TeachingSessionSchema);