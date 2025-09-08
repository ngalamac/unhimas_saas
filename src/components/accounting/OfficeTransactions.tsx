import React, { useState, useEffect } from 'react';
import { fetchTransactions, deleteTransaction, OfficeTransaction } from '../../api/accounting';
import { formatXAF } from '../../utils/currency';
import { PlusCircle, Trash2, Edit, Loader, AlertCircle } from 'lucide-react';
import CreateTransactionForm from './CreateTransactionForm';

const OfficeTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<OfficeTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });

    useEffect(() => {
        loadTransactions(1);
    }, []);

    const loadTransactions = async (page: number) => {
        setLoading(true);
        setError(null);
        try {
            const { data, meta: newMeta } = await fetchTransactions({ page: page, limit: meta.limit });
            setTransactions(data);
            setMeta(newMeta);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionCreated = (newTransaction: OfficeTransaction) => {
        setTransactions([newTransaction, ...transactions]);
        setShowCreateForm(false);
        loadTransactions(1);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await deleteTransaction(id);
                loadTransactions(meta.page);
            } catch (err: any) {
                setError(err.message || 'Failed to delete transaction');
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Office Transactions</h1>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
                >
                    <PlusCircle className="mr-2" size={20} />
                    New Transaction
                </button>
            </div>

            {error && (
                <div className="flex items-center p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    <AlertCircle className="mr-2" size={20} />
                    {error}
                </div>
            )}

            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-bold">Create Transaction</h2>
                        </div>
                        <CreateTransactionForm onTransactionCreated={handleTransactionCreated} />
                        <div className="p-4 border-t">
                            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Amount</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8">
                                        <Loader className="animate-spin inline-block" size={24} />
                                    </td>
                                </tr>
                            ) : transactions.map(tx => (
                                <tr key={tx._id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{tx.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{formatXAF(tx.amount)}</td>
                                    <td className="px-6 py-4">{tx.description}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <button className="p-1 text-gray-500 hover:text-gray-800"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(tx._id)} className="p-1 text-red-500 hover:text-red-800"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination would go here */}
            </div>
        </div>
    );
};

export default OfficeTransactions;
