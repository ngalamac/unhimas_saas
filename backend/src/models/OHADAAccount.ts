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
  // Always compute level
  this.level = this.code.length;

  // Respect manual override: if a route explicitly set type & category, it should also set a hidden flag.
  // We detect by checking if there is a non-empty this.$__.priorDoc? Not reliable. Instead rely on a symbol field not in schema is not persisted.
  // Simpler: if type & category already set AND they don't match what derivation would produce, keep them.
  const currentType = this.type;
  const currentCategory = this.category;

  const derive = () => {
    const firstDigit = this.code.charAt(0);
    switch (firstDigit) {
      case '1':
        return { t: 'equity', c: 'non-current' } as const;
      case '2':
        return { t: 'asset', c: 'non-current' } as const;
      case '3':
        return { t: 'asset', c: 'current' } as const;
      case '4':
        if (this.code.startsWith('41') || this.code.startsWith('46')) {
          return { t: 'asset', c: 'current' } as const;
        }
        return { t: 'liability', c: 'current' } as const;
      case '5':
        return { t: 'asset', c: 'current' } as const;
      case '6':
        if (this.code.startsWith('64') || this.code.startsWith('65')) {
          return { t: 'expense', c: 'financial' } as const;
        } else if (this.code.startsWith('69')) {
          return { t: 'expense', c: 'extraordinary' } as const;
        }
        return { t: 'expense', c: 'operating' } as const;
      case '7':
        if (this.code.startsWith('74') || this.code.startsWith('75')) {
          return { t: 'income', c: 'financial' } as const;
        } else if (this.code.startsWith('79')) {
          return { t: 'income', c: 'extraordinary' } as const;
        }
        return { t: 'income', c: 'operating' } as const;
      case '8':
        return { t: 'asset', c: 'extraordinary' } as const; // off balance sheet
      default:
        return { t: currentType, c: currentCategory } as const;
    }
  };

  const { t: derivedType, c: derivedCategory } = derive();

  // If current values are blank or undefined, fill them.
  const manualProvided = !!currentType && !!currentCategory && (currentType !== derivedType || currentCategory !== derivedCategory);
  if (!manualProvided) {
    this.type = derivedType;
    this.category = derivedCategory;
  }

  return next();
});

export default mongoose.model<IOHADAAccount>('OHADAAccount', OHADAAccountSchema);