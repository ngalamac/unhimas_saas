import React, { useEffect, useState } from 'react';
import { formatXAF } from '../../utils/currency';
import { getJournalEntries } from '../../api/transactions';
import { JournalEntry } from '../../types/accounting';
import JournalEntryDetails from './JournalEntryDetails'; // Assuming this component will be created
import JournalEntryForm from './JournalEntryForm'; // Assuming this component will be created

const AccountingPage: React.FC = () => {
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [total, setTotal] = useState(0);

    // UI state
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [showAdd, setShowAdd] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    useEffect(() => {
        fetchEntries(1);
    }, []);

    async function fetchEntries(p = 1) {
        try {
            setLoading(true);
            const { data, meta } = await getJournalEntries({ page: p, limit });
            setJournalEntries(data);
            setTotal(meta.total);
            setPage(p);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch journal entries');
        } finally {
            setLoading(false);
        }
    }

    const filteredEntries = journalEntries.filter(entry => {
        if (activeTab !== 'all' && entry.status !== activeTab) return false;
        if (query && !entry.memo.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="p-6">
            {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
            )}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Accounting Journal</h1>
                    <p className="text-sm text-gray-500">{total} entries</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowAdd(true)} disabled={loading} className={`px-3 py-2 ${loading ? 'bg-blue-300' : 'bg-blue-600'} text-white rounded`}>Add Entry</button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center bg-gray-50 rounded px-3 py-2 w-96">
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by memo..." className="ml-2 outline-none bg-transparent w-full text-sm" />
                </div>
                <select value={activeTab} onChange={e => setActiveTab(e.target.value as any)} className="px-3 py-2 border rounded">
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
                <button onClick={() => fetchEntries(1)} className="px-3 py-2 border rounded">Refresh</button>
            </div>

            <div className="bg-white rounded border overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Memo</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.map(entry => (
                            <tr key={entry._id} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2">{new Date(entry.date).toLocaleDateString()}</td>
                                <td className="px-3 py-2">{entry.memo}</td>
                                <td className="px-3 py-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {entry.status}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">
                                    {formatXAF(entry.lines.reduce((sum, line) => sum + line.debit, 0))}
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setSelectedEntry(entry)} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">View</button>
                                        {entry.status === 'pending' && (
                                            <button onClick={() => setEditingEntry(entry)} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Edit</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedEntry && (
                <JournalEntryDetails entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
            )}

            {(showAdd || editingEntry) && (
                <JournalEntryForm
                    entry={editingEntry}
                    onClose={() => { setShowAdd(false); setEditingEntry(null); }}
                    onSave={() => {
                        setShowAdd(false);
                        setEditingEntry(null);
                        fetchEntries(page);
                    }}
                />
            )}
        </div>
    );
};

export default AccountingPage;
