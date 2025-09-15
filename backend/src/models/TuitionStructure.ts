import mongoose, { Schema, Document } from 'mongoose';

export interface ITuitionInstallment {
  key: string;
  label?: string;
  amount: number;
  dueDate?: string;
  ohadaAccountCode?: string;
  ohadaAccountName?: string;
  isRequired?: boolean;
  order?: number;
}

export interface ITuitionStructure extends Document {
  name: string;
  program: mongoose.Types.ObjectId | string;
  department: mongoose.Types.ObjectId | string;
  level: number;
  academicYear: string;
  installments: ITuitionInstallment[];
  totalAmount: number;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId | string;
  updatedBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const InstallmentSchema = new Schema<ITuitionInstallment>({
  key: { type: String, required: true },
  label: { type: String },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: String },
  ohadaAccountCode: { type: String },
  ohadaAccountName: { type: String },
  isRequired: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { _id: false });

const TuitionStructureSchema = new Schema<ITuitionStructure>({
  name: { type: String, required: true, trim: true },
  program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  level: { type: Number, required: true, min: 1 },
  academicYear: { type: String, required: true },
  installments: { type: [InstallmentSchema], validate: [(v: any[]) => v.length > 0, 'At least one installment required'] },
  totalAmount: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<ITuitionStructure>('TuitionStructure', TuitionStructureSchema);
