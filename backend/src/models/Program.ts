import mongoose, { Document, Schema } from 'mongoose';

export interface IProgram extends Document {
  name: string;
  type: 'Undergraduate' | 'Postgraduate' | string;
  subType?: string; // HND, Diploma, Degree etc (informational)
  isActive: boolean;
  duration?: number;
  semestersPerYear?: number;
  departments: mongoose.Types.ObjectId[];
}

const ProgramSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  duration: { type: Number, default: 3 },
  semestersPerYear: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
  subType: { type: String },
  departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }]
}, { timestamps: true });

ProgramSchema.index({ name: 1 });
ProgramSchema.index({ type: 1 });

export default mongoose.model<IProgram>('Program', ProgramSchema);
