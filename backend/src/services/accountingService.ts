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
