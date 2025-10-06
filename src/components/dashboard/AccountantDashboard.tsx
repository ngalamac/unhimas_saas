import React, { useEffect, useState } from 'react';
import { DollarSign, CreditCard, TrendingUp, AlertCircle, FileText, Users, Mail, MessageSquare } from 'lucide-react';
import { formatXAF } from '../../utils/currency';
import { getJournalEntries } from '../../api/transactions';
import { getStudents } from '../../api/students';
import { JournalEntry } from '../../types/accounting';
import { Student } from '../../types/school';
import fetchClient from '../../lib/fetchClient';

export const AccountantDashboard: React.FC = () => {
    const [summary, setSummary] = useState<{ totalIncome: number, totalExpense: number, net: number } | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<JournalEntry[]>([]);
    const [unpaidStudents, setUnpaidStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [summaryRes, transactionsRes, studentsRes] = await Promise.all([
                    fetchClient.get('/api/accounting/summary'),
                    fetchClient.get('/api/accounting?limit=5'),
                    getStudents(undefined, 1, 5, { status: 'Overdue' })
                ]);

                if (summaryRes.ok) {
                    const body = await summaryRes.json();
                    setSummary(body.summary || body.data || body);
                }

                if (transactionsRes.ok) {
                    const transactionsData = await transactionsRes.json();
                    setRecentTransactions(transactionsData.data || []);
                }
                
                setUnpaidStudents(studentsRes.data || []);

            } catch (error) {
                console.error("Failed to fetch accountant dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h1>
                    <p className="text-gray-600">Financial management and fee tracking</p>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900">{formatXAF(summary?.totalIncome || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Expense</p>
                            <p className="text-2xl font-bold text-gray-900">{formatXAF(summary?.totalExpense || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Net Profit</p>
                            <p className="text-2xl font-bold text-gray-900">{formatXAF(summary?.net || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Unpaid Students</p>
                            <p className="text-2xl font-bold text-gray-900">{unpaidStudents.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Transactions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                            <CreditCard className="w-4 h-4" />
                            <span>Process Payment</span>
                        </button>
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Generate Invoice</span>
                        </button>
                        <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>Financial Report</span>
                        </button>
                    <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                      onClick={async () => {
                        try {
                          const overdue = unpaidStudents.slice(0, 25); // limit batch
                          await Promise.all(overdue.map(async (s) => {
                            await fetchClient.post('/api/communication/email', {
                              to: s.email,
                              subject: 'Tuition Payment Reminder',
                              text: `Dear ${s.firstName},\n\nOur records show an outstanding tuition balance of ${formatXAF(s.balanceDue)}. Please make payment at your earliest convenience.\n\nThank you.`,
                            });
                          }));
                          alert('Payment reminders queued for selected students');
                        } catch (e) {
                          alert('Failed to send reminders');
                        }
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Payment Reminders</span>
                    </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                        {recentTransactions.map((entry) => (
                            <div key={entry._id} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium">{entry.memo}</p>
                                    <p className="text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {entry.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Outstanding Payments */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Payments</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {unpaidStudents.map((student) => (
                                <tr key={student._id}>
                                    <td className="px-4 py-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                                            <p className="text-sm text-gray-500">{student.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                        {typeof student.program === 'string' ? student.program : (student.program as any)?.name} - Level {student.level}
                                    </td>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                        {formatXAF(student.balanceDue)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                            {student.tuitionStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <button className="text-blue-600 hover:text-blue-900 text-sm" onClick={async () => {
                                          try {
                                            await fetchClient.post('/api/communication/email', {
                                              to: student.email,
                                              subject: 'Tuition Payment Reminder',
                                              text: `Dear ${student.firstName},\n\nOur records show an outstanding tuition balance of ${formatXAF(student.balanceDue)}. Please make payment at your earliest convenience.\n\nThank you.`,
                                            });
                                            alert('Reminder queued');
                                          } catch (e) { alert('Failed to send'); }
                                        }}>
                                            Send Reminder
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};