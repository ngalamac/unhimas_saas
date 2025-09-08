import React, { useState } from 'react';
import fetchClient from '../../../lib/fetchClient';
import { BarChart3, Calendar, Filter } from 'lucide-react';

interface ReportData {
    period: string;
    income: number;
    expenses: number;
    net: number;
}

export const IncomeVsExpensesPage: React.FC = () => {
    const [data, setData] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        period: 'monthly',
        from: '',
        to: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('period', filters.period);
            if (filters.from) params.append('from', filters.from);
            if (filters.to) params.append('to', filters.to);

            const response = await fetchClient.get(`/api/accounting/reports/income-vs-expenses?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch report');
            }
            const reportData = await response.json();
            setData(reportData);
        } catch (error) {
            console.error(error);
            alert('Failed to generate report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Income vs. Expenses</h1>
                    <p className="text-gray-600">Analyze financial performance over time.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                        <select
                            id="period"
                            name="period"
                            value={filters.period}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <input
                            type="date"
                            id="from"
                            name="from"
                            value={filters.from}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input
                            type="date"
                            id="to"
                            name="to"
                            value={filters.to}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 disabled:bg-blue-300"
                        >
                            <Filter className="w-4 h-4" />
                            <span>{loading ? 'Generating...' : 'Generate Report'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TODO: Add a chart representation here if a charting library is available */}

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={row.period}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.period}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">{new Intl.NumberFormat().format(row.income)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">{new Intl.NumberFormat().format(row.expenses)}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${row.net >= 0 ? 'text-gray-900' : 'text-red-700'}`}>
                                    {new Intl.NumberFormat().format(row.net)}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-gray-500">
                                    {loading ? 'Loading data...' : 'No data to display. Please generate a report.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IncomeVsExpensesPage;
