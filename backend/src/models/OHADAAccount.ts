import mongoose, { Schema, Document } from 'mongoose';

export interface IOHADAAccount extends Document {
  code: string; // OHADA account code (e.g., 101, 211, 601)
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  category: 'current' | 'non-current' | 'operating' | 'financial' | 'extraordinary';
  parentCode?: string; // For sub-accounts
  level: number; // 1-4 (Class, Group, Account, Sub-account)
  isActive: boolean;
  balance: number;
  debitBalance: number;
  creditBalance: number;
  description?: string;
  branch?: mongoose.Types.ObjectId; // Optional branch-specific accounts
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OHADAAccountSchema: Schema = new Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    match: /^[1-8]\d{0,3}$/ // OHADA codes: 1-8 followed by 0-3 digits
  },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['asset', 'liability', 'equity', 'income', 'expense'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['current', 'non-current', 'operating', 'financial', 'extraordinary'], 
    required: true 
  },
  parentCode: { type: String },
  level: { type: Number, required: true, min: 1, max: 4 },
  isActive: { type: Boolean, default: true },
  balance: { type: Number, default: 0 },
  debitBalance: { type: Number, default: 0 },
  creditBalance: { type: Number, default: 0 },
  description: { type: String },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes for efficient queries
OHADAAccountSchema.index({ code: 1 });
OHADAAccountSchema.index({ type: 1 });
OHADAAccountSchema.index({ level: 1 });
OHADAAccountSchema.index({ parentCode: 1 });
OHADAAccountSchema.index({ branch: 1 });
OHADAAccountSchema.index({ isActive: 1 });

// Determine account type and category from OHADA code
OHADAAccountSchema.pre<IOHADAAccount>('save', function(next) {
  const firstDigit = this.code.charAt(0);
  this.level = this.code.length;
  
  switch (firstDigit) {
    case '1':
      this.type = 'equity';
      this.category = 'non-current';
      break;
    case '2':
      this.type = 'asset';
      this.category = 'non-current';
      break;
    case '3':
      this.type = 'asset';
      this.category = 'current';
      break;
    case '4':
      // Determine if asset or liability based on specific codes
      if (this.code.startsWith('41') || this.code.startsWith('46')) {
        this.type = 'asset';
      } else {
        this.type = 'liability';
      }
      this.category = 'current';
      break;
    case '5':
      this.type = 'asset';
      this.category = 'current';
      break;
    case '6':
      this.type = 'expense';
      if (this.code.startsWith('64') || this.code.startsWith('65')) {
        this.category = 'financial';
      } else if (this.code.startsWith('69')) {
        this.category = 'extraordinary';
      } else {
        this.category = 'operating';
      }
      break;
    case '7':
      this.type = 'income';
      if (this.code.startsWith('74') || this.code.startsWith('75')) {
        this.category = 'financial';
      } else if (this.code.startsWith('79')) {
        this.category = 'extraordinary';
      } else {
        this.category = 'operating';
      }
      break;
    case '8':
      this.type = 'asset'; // Off-balance sheet items
      this.category = 'extraordinary';
      break;
  }
  
  next();
});

export default mongoose.model<IOHADAAccount>('OHADAAccount', OHADAAccountSchema);