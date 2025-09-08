import React from 'react';
import { JournalEntry } from '../../types/accounting';
import { formatXAF } from '../../utils/currency';
import { approveJournalEntry, rejectJournalEntry } from '../../api/transactions';

interface JournalEntryDetailsProps {
    entry: JournalEntry;
    onClose: () => void;
    onAction: () => void;
}

const JournalEntryDetails: React.FC<JournalEntryDetailsProps> = ({ entry, onClose, onAction }) => {
    const handleApprove = async () => {
        if (confirm('Are you sure you want to approve this entry?')) {
            try {
                await approveJournalEntry(entry._id);
                onAction();
                onClose();
            } catch (error) {
                alert('Failed to approve entry');
            }
        }
    };

    const handleReject = async () => {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
            try {
                await rejectJournalEntry(entry._id, reason);
                onAction();
                onClose();
            } catch (error) {
                alert('Failed to reject entry');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded w-full max-w-2xl p-6">
                <h3 className="font-semibold text-lg mb-4">Journal Entry Details</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</div>
                    <div><strong>Status:</strong> {entry.status}</div>
                    <div className="col-span-2"><strong>Memo:</strong> {entry.memo}</div>
                </div>

                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left">Account</th>
                            <th className="px-3 py-2 text-right">Debit</th>
                            <th className="px-3 py-2 text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entry.lines.map((line, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-3 py-2">{(line.account as any).name || line.account}</td>
                                <td className="px-3 py-2 text-right">{formatXAF(line.debit)}</td>
                                <td className="px-3 py-2 text-right">{formatXAF(line.credit)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-3 py-2 border rounded">Close</button>
                    {entry.status === 'pending' && (
                        <>
                            <button onClick={handleApprove} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
                            <button onClick={handleReject} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JournalEntryDetails;
