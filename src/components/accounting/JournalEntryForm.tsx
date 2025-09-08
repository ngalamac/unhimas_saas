import React, { useState, useEffect } from 'react';
import { JournalEntry, Account } from '../../types/accounting';
import { createJournalEntry, updateJournalEntry } from '../../api/transactions';
import fetchClient from '../../lib/fetchClient';

interface JournalEntryFormProps {
    entry?: JournalEntry | null;
    onClose: () => void;
    onSave: () => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ entry, onClose, onSave }) => {
    const [memo, setMemo] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [lines, setLines] = useState([{ account: '', debit: 0, credit: 0 }]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (entry) {
            setMemo(entry.memo);
            setDate(new Date(entry.date).toISOString().split('T')[0]);
            setLines(entry.lines.map(line => ({
                account: (line.account as any)._id || line.account,
                debit: line.debit,
                credit: line.credit
            })));
        }

        async function fetchAccounts() {
            try {
                const res = await fetchClient.get('/api/accounts');
                if (res.ok) {
                    const body = await res.json();
                    setAccounts(body.data);
                }
            } catch (err) {
                console.error('Failed to fetch accounts', err);
            }
        }
        fetchAccounts();
    }, [entry]);

    const handleLineChange = (index: number, field: string, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const addLine = () => {
        setLines([...lines, { account: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError(null);
        try {
            const totalDebits = lines.reduce((sum, line) => sum + Number(line.debit), 0);
            const totalCredits = lines.reduce((sum, line) => sum + Number(line.credit), 0);
            if (Math.abs(totalDebits - totalCredits) > 0.01) {
                setError('Debits and credits must be balanced.');
                return;
            }

            const payload = {
                memo,
                date,
                lines: lines.map(line => ({ ...line, debit: Number(line.debit), credit: Number(line.credit) })),
            };

            if (entry) {
                await updateJournalEntry(entry._id, payload);
            } else {
                await createJournalEntry(payload);
            }
            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to save entry');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded w-full max-w-3xl p-6">
                <h3 className="font-semibold text-lg mb-4">{entry ? 'Edit' : 'Create'} Journal Entry</h3>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="Memo" className="col-span-1 border rounded p-2" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="col-span-1 border rounded p-2" />
                </div>

                <div>
                    {lines.map((line, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                            <select
                                value={line.account}
                                onChange={e => handleLineChange(index, 'account', e.target.value)}
                                className="col-span-5 border rounded p-2"
                            >
                                <option value="">Select Account</option>
                                {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} ({acc.type})</option>)}
                            </select>
                            <input
                                type="number"
                                value={line.debit}
                                onChange={e => handleLineChange(index, 'debit', e.target.value)}
                                placeholder="Debit"
                                className="col-span-3 border rounded p-2"
                            />
                            <input
                                type="number"
                                value={line.credit}
                                onChange={e => handleLineChange(index, 'credit', e.target.value)}
                                placeholder="Credit"
                                className="col-span-3 border rounded p-2"
                            />
                            <button onClick={() => removeLine(index)} className="col-span-1 text-red-500">X</button>
                        </div>
                    ))}
                    <button onClick={addLine} className="text-blue-600 mt-2">+ Add Line</button>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
                    <button onClick={handleSubmit} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
                </div>
            </div>
        </div>
    );
};

export default JournalEntryForm;
