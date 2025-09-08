import { Branch } from './school';
import { User } from './auth';

export interface Account {
    _id: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
    balance: number;
    isActive: boolean;
    branch: Branch | string;
    createdAt: string;
    updatedAt: string;
}

export interface JournalLine {
    account: Account | string;
    debit: number;
    credit: number;
    description?: string;
}

export interface JournalEntry {
    _id: string;
    branch: Branch | string;
    date: string;
    memo: string;
    lines: JournalLine[];
    status: 'pending' | 'approved' | 'rejected';
    createdBy: User | string;
    approvedBy?: User | string;
    rejectionReason?: string;
    relatedDocument?: {
        model: string;
        docId: string;
    };
    currency: string;
    createdAt: string;
    updatedAt:string;
}
