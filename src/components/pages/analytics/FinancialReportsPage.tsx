import React, { useState } from 'react';
import { DollarSign, TrendingUp, Download, Calendar, CreditCard, PieChart } from 'lucide-react';

export const FinancialReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const financialData = {
    totalRevenue: 125000000,
    totalExpenses: 45000000,
    netProfit: 80000000,
    outstandingFees: 25000000,
    collectionRate: 85.2
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive financial analysis and reporting</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="current-quarter">Current Quarter</option>
            <option value="current-year">Current Year</option>
          </select>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialData.totalRevenue)}</p>
              <p className="text-xs text-green-600">↗ +15% from last month</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialData.totalExpenses)}</p>
              <p className="text-xs text-red-600">↗ +8% from last month</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialData.netProfit)}</p>
              <p className="text-xs text-green-600">↗ +22% from last month</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Outstanding Fees</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialData.outstandingFees)}</p>
              <p className="text-xs text-yellow-600">↘ -5% from last month</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-lg font-bold text-gray-900">{financialData.collectionRate}%</p>
              <p className="text-xs text-green-600">↗ +3.2% from last month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses (Monthly)</h2>
          <div className="h-64">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <pattern id="grid4" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid4)" />
              
              {/* Y-axis labels */}
              <text x="10" y="20" className="text-xs fill-gray-500">150M</text>
              <text x="10" y="60" className="text-xs fill-gray-500">120M</text>
              <text x="10" y="100" className="text-xs fill-gray-500">90M</text>
              <text x="10" y="140" className="text-xs fill-gray-500">60M</text>
              <text x="10" y="180" className="text-xs fill-gray-500">30M</text>
              
              {/* X-axis labels */}
              <text x="60" y="195" className="text-xs fill-gray-500">Jan</text>
              <text x="120" y="195" className="text-xs fill-gray-500">Feb</text>
              <text x="180" y="195" className="text-xs fill-gray-500">Mar</text>
              <text x="240" y="195" className="text-xs fill-gray-500">Apr</text>
              <text x="300" y="195" className="text-xs fill-gray-500">May</text>
              <text x="360" y="195" className="text-xs fill-gray-500">Jun</text>
              
              {/* Revenue bars */}
              <rect x="50" y="40" width="15" height="140" fill="#10b981" opacity="0.8"/>
              <rect x="110" y="50" width="15" height="130" fill="#10b981" opacity="0.8"/>
              <rect x="170" y="45" width="15" height="135" fill="#10b981" opacity="0.8"/>
              <rect x="230" y="35" width="15" height="145" fill="#10b981" opacity="0.8"/>
              <rect x="290" y="30" width="15" height="150" fill="#10b981" opacity="0.8"/>
              <rect x="350" y="25" width="15" height="155" fill="#10b981" opacity="0.8"/>
              
              {/* Expense bars */}
              <rect x="70" y="120" width="15" height="60" fill="#ef4444" opacity="0.8"/>
              <rect x="130" y="115" width="15" height="65" fill="#ef4444" opacity="0.8"/>
              <rect x="190" y="110" width="15" height="70" fill="#ef4444" opacity="0.8"/>
              <rect x="250" y="105" width="15" height="75" fill="#ef4444" opacity="0.8"/>
              <rect x="310" y="100" width="15" height="80" fill="#ef4444" opacity="0.8"/>
              <rect x="370" y="95" width="15" height="85" fill="#ef4444" opacity="0.8"/>
            </svg>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Expenses</span>
            </div>
          </div>
        </div>

        {/* Fee Collection by Program */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Collection by Program</h2>
          <div className="space-y-4">
            {[
              { program: 'HND Programs', collected: 45000000, total: 52000000, rate: 86.5 },
              { program: 'Bachelor Programs', collected: 58000000, total: 65000000, rate: 89.2 },
              { program: 'Masters Programs', collected: 22000000, total: 25000000, rate: 88.0 }
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{item.program}</span>
                  <span className="text-sm text-gray-600">{item.rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${item.rate}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Collected: {formatCurrency(item.collected)}</span>
                  <span>Total: {formatCurrency(item.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
          <div className="space-y-3">
            {[
              { category: 'Staff Salaries', amount: 25000000, percentage: 55.6 },
              { category: 'Infrastructure', amount: 8000000, percentage: 17.8 },
              { category: 'Utilities', amount: 5000000, percentage: 11.1 },
              { category: 'Equipment', amount: 4000000, percentage: 8.9 },
              { category: 'Other', amount: 3000000, percentage: 6.7 }
            ].map((expense, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{expense.category}</p>
                  <p className="text-sm text-gray-600">{expense.percentage}% of total</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Distribution</h2>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="100.5 251.2" strokeDashoffset="0"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="75.4 251.2" strokeDashoffset="-100.5"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="50.2 251.2" strokeDashoffset="-175.9"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="25.1 251.2" strokeDashoffset="-226.1"/>
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Bank Transfer (40%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Mobile Money (30%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Cash (20%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Online (10%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};