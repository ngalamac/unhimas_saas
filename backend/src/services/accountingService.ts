import JournalEntry from '../models/JournalEntry';
import Account from '../models/Account';
import mongoose from 'mongoose';

const getAccountId = async (name: string): Promise<mongoose.Types.ObjectId> => {
    const account = await Account.findOne({ name });
    if (!account) throw new Error(`Account not found: ${name}`);
    return account._id;
};

export const recordGenericTransaction = async (
    branchId: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId,
    type: 'income' | 'expense',
    category: string,
    amount: number,
    description: string,
    date: Date,
    currency: string
) => {
    const cashAccountId = await getAccountId('Cash');
    const categoryAccountId = await getAccountId(category);

    let debitAccountId, creditAccountId;
    if (type === 'income') {
        debitAccountId = cashAccountId;
        creditAccountId = categoryAccountId;
    } else { // expense
        debitAccountId = categoryAccountId;
        creditAccountId = cashAccountId;
    }

    const journalEntry = new JournalEntry({
        date,
        memo: description,
        branch: branchId,
        createdBy: createdBy,
        currency: currency,
        lines: [
            { account: debitAccountId, debit: amount, credit: 0 },
            { account: creditAccountId, debit: 0, credit: amount },
        ],
    });

    await journalEntry.save();
    return journalEntry;
};

// Create a multi-line journal entry with pre-validated, already balanced lines.
// Expects caller to supply lines with accounts already resolved to ObjectIds or as strings resolvable to accounts.
// Lines shape: { account: ObjectId | string, debit: number, credit: number }[]
export const recordJournalEntry = async (entry: {
    branch: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId,
    memo?: string,
    date: Date,
    currency?: string,
    lines: { account: mongoose.Types.ObjectId | string; debit: number; credit: number }[]
}) => {
    // Resolve any string accounts to ObjectIds
    const resolvedLines = [] as { account: mongoose.Types.ObjectId; debit: number; credit: number }[];
    for (const line of entry.lines) {
        let accountId: mongoose.Types.ObjectId;
        if (typeof line.account === 'string') {
            const account = await Account.findOne({ name: line.account });
            if (!account) throw new Error(`Account not found: ${line.account}`);
            accountId = account._id as mongoose.Types.ObjectId;
        } else {
            accountId = line.account;
        }
        resolvedLines.push({ account: accountId, debit: line.debit, credit: line.credit });
    }

    const totalDebit = resolvedLines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = resolvedLines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
        throw new Error('Journal entry not balanced');
    }

    const journalEntry = new JournalEntry({
        date: entry.date,
        memo: entry.memo,
        branch: entry.branch,
        createdBy: entry.createdBy,
        currency: entry.currency || 'XAF',
        lines: resolvedLines,
        status: 'pending'
    });

    await journalEntry.save();
    return journalEntry;
};
