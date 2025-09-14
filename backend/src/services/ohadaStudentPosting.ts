import mongoose from 'mongoose';
import OHADAAccount from '../models/OHADAAccount';
import OHADAJournalEntry from '../models/OHADAJournalEntry';

/**
 * Post a tuition payment journal entry into OHADA ledger linking the student & tuition transaction.
 * Pattern: Dr Cash/Bank (2/3/5 class)  Cr Tuition Receivable (4x or 41x) OR if already using receivable then treat revenue recognition elsewhere.
 * For now we assume there is an OHADA account code for Cash (e.g. 57xx) and a Tuition Revenue code (7xxx) and a Tuition Receivable (41x).
 * We keep it simple: when payment occurs we:
 *   Dr Cash (actual receipt)
 *   Cr Tuition Revenue (recognize revenue immediately) OR Cr Tuition Receivable if an invoice model is added later.
 * If a receivable account code is provided we will credit that instead of the revenue (two-step model: invoice recognizes revenue, payment clears receivable).
 */
export async function postTuitionPaymentJournal(opts: {
  branch: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  tuitionTransactionId: mongoose.Types.ObjectId;
  amount: number;
  currency?: string; // currency is informational currently (OHADAJournalEntry doesn't store it yet)
  date?: Date;
  createdBy: mongoose.Types.ObjectId;
  cashAccountCode: string;            // e.g. '570' or '571'
  tuitionRevenueAccountCode: string;  // e.g. '706' (Tuition revenue)
  tuitionReceivableAccountCode?: string; // optional: if provided we credit receivable instead of revenue
  description?: string;
}): Promise<any> {
  const {
    branch, studentId, tuitionTransactionId, amount,
    createdBy, cashAccountCode, tuitionRevenueAccountCode,
    tuitionReceivableAccountCode, description
  } = opts;

  if (amount <= 0) throw new Error('Amount must be positive');

  const cashAccount = await OHADAAccount.findOne({ code: cashAccountCode });
  if (!cashAccount) throw new Error(`Cash account not found: ${cashAccountCode}`);
  const revenueAccount = await OHADAAccount.findOne({ code: tuitionRevenueAccountCode });
  if (!revenueAccount) throw new Error(`Tuition revenue account not found: ${tuitionRevenueAccountCode}`);

  let receivableAccount: any = null;
  if (tuitionReceivableAccountCode) {
    receivableAccount = await OHADAAccount.findOne({ code: tuitionReceivableAccountCode });
    if (!receivableAccount) throw new Error(`Tuition receivable account not found: ${tuitionReceivableAccountCode}`);
  }

  const date = opts.date || new Date();
  const reference = `STU-${studentId.toString()}-${tuitionTransactionId.toString()}`;
  const lines: any[] = [];

  // Debit Cash
  lines.push({
    account: cashAccount._id,
    accountCode: cashAccount.code,
    accountName: cashAccount.name,
    debit: amount,
    credit: 0,
    description: description || 'Tuition payment',
    student: studentId,
    tuitionTransaction: tuitionTransactionId
  });

  if (receivableAccount) {
    // Credit Receivable (clearing)
    lines.push({
      account: receivableAccount._id,
      accountCode: receivableAccount.code,
      accountName: receivableAccount.name,
      debit: 0,
      credit: amount,
      description: description || 'Tuition payment (receivable settlement)',
      student: studentId,
      tuitionTransaction: tuitionTransactionId
    });
  } else {
    // Credit Revenue directly
    lines.push({
      account: revenueAccount._id,
      accountCode: revenueAccount.code,
      accountName: revenueAccount.name,
      debit: 0,
      credit: amount,
      description: description || 'Tuition payment (revenue recognition)',
      student: studentId,
      tuitionTransaction: tuitionTransactionId
    });
  }

  const entry = new OHADAJournalEntry({
    date,
    reference,
    description: description || 'Tuition payment',
    lines,
    createdBy,
    branch,
    status: 'posted'
  } as any);

  await entry.validate();
  await entry.save();
  return entry;
}

/**
 * (Optional future) Record initial tuition charge (invoice): Dr Tuition Receivable / Cr Tuition Revenue
 */
export async function postTuitionInvoiceJournal(opts: {
  branch: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  amount: number;
  createdBy: mongoose.Types.ObjectId;
  tuitionReceivableAccountCode: string;
  tuitionRevenueAccountCode: string;
  description?: string;
  date?: Date;
}): Promise<any> {
  const { branch, studentId, amount, createdBy, tuitionReceivableAccountCode, tuitionRevenueAccountCode, description } = opts;
  if (amount <= 0) throw new Error('Amount must be positive');
  const receivable = await OHADAAccount.findOne({ code: tuitionReceivableAccountCode });
  if (!receivable) throw new Error(`Tuition receivable account not found: ${tuitionReceivableAccountCode}`);
  const revenue = await OHADAAccount.findOne({ code: tuitionRevenueAccountCode });
  if (!revenue) throw new Error(`Tuition revenue account not found: ${tuitionRevenueAccountCode}`);

  const date = opts.date || new Date();
  const reference = `STUINV-${studentId.toString()}-${Date.now()}`;
  const lines = [
    {
      account: receivable._id,
      accountCode: receivable.code,
      accountName: receivable.name,
      debit: amount,
      credit: 0,
      description: description || 'Tuition invoice',
      student: studentId
    },
    {
      account: revenue._id,
      accountCode: revenue.code,
      accountName: revenue.name,
      debit: 0,
      credit: amount,
      description: description || 'Tuition revenue',
      student: studentId
    }
  ];

  const entry = new OHADAJournalEntry({
    date,
    reference,
    description: description || 'Tuition invoice',
    lines,
    createdBy,
    branch,
    status: 'posted'
  } as any);
  await entry.validate();
  await entry.save();
  return entry;
}
