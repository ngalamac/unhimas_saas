import JournalEntry from '../models/JournalEntry';
import Account from '../models/Account';
import mongoose from 'mongoose';

// This is a simplified example. In a real application, you would have a more robust way
// to look up accounts, perhaps from a dedicated Chart of Accounts service.
const getAccountId = async (name: string): Promise<mongoose.Types.ObjectId> => {
    const account = await Account.findOne({ name });
    if (!account) throw new Error(`Account not found: ${name}`);
    return account._id;
};

export const recordTuitionPayment = async (
    studentId: mongoose.Types.ObjectId,
    branchId: mongoose.Types.ObjectId,
    amount: number,
    createdBy: mongoose.Types.ObjectId
) => {
    const cashAccountId = await getAccountId('Cash');
    const tuitionIncomeAccountId = await getAccountId('Tuition Income');

    const journalEntry = new JournalEntry({
        date: new Date(),
        memo: `Tuition payment for student ${studentId}`,
        branch: branchId,
        createdBy: createdBy,
        lines: [
            { account: cashAccountId, debit: amount, credit: 0, description: 'Cash received from tuition' },
            { account: tuitionIncomeAccountId, debit: 0, credit: amount, description: 'Tuition income' },
        ],
    });

    await journalEntry.save();
    return journalEntry;
};

export const recordGenericTransaction = async (
    branchId: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId,
    type: 'income' | 'expense',
    category: string,
    amount: number,
    description: string,
    date: Date
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
        lines: [
            { account: debitAccountId, debit: amount, credit: 0 },
            { account: creditAccountId, debit: 0, credit: amount },
        ],
    });

    await journalEntry.save();
    return journalEntry;
};
