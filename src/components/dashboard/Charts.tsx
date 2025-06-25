import React from 'react';

export const Charts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Fee Collection vs Expenses Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Fee Collection Vs Expenses (June 2025)</h3>
        <div className="flex items-center justify-center h-64">
          {/* Donut Chart Placeholder */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="8"
              />
              {/* Fee Collection arc (blue) - 70% */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray="175.9 251.2"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Expenses arc (red) - 30% */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#ef4444"
                strokeWidth="8"
                strokeDasharray="75.4 251.2"
                strokeDashoffset="-175.9"
                strokeLinecap="round"
              />
            </svg>
            {/* Center naira sign */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">CFA</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Fee Collection (2.4M CFA)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Expenses (1.2M CFA)</span>
          </div>
        </div>
      </div>

      {/* Student Enrollment Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Enrollment Trends (2025)</h3>
        <div className="h-64">
          {/* Area Chart Placeholder */}
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Y-axis labels */}
            <text x="10" y="20" className="text-xs fill-gray-500">1400</text>
            <text x="10" y="50" className="text-xs fill-gray-500">1200</text>
            <text x="10" y="80" className="text-xs fill-gray-500">1000</text>
            <text x="10" y="110" className="text-xs fill-gray-500">800</text>
            <text x="10" y="140" className="text-xs fill-gray-500">600</text>
            <text x="10" y="170" className="text-xs fill-gray-500">400</text>
            <text x="10" y="200" className="text-xs fill-gray-500">200</text>
            
            {/* X-axis labels */}
            <text x="60" y="195" className="text-xs fill-gray-500">Jan</text>
            <text x="100" y="195" className="text-xs fill-gray-500">Feb</text>
            <text x="140" y="195" className="text-xs fill-gray-500">Mar</text>
            <text x="180" y="195" className="text-xs fill-gray-500">Apr</text>
            <text x="220" y="195" className="text-xs fill-gray-500">May</text>
            <text x="260" y="195" className="text-xs fill-gray-500">Jun</text>
            
            {/* Area chart paths */}
            <path
              d="M 40 120 L 80 110 L 120 90 L 160 70 L 200 85 L 240 75 L 280 65 L 320 60 L 360 55 L 360 180 L 40 180 Z"
              fill="#3b82f6"
              opacity="0.3"
            />
            <path
              d="M 40 140 L 80 135 L 120 125 L 160 115 L 200 120 L 240 110 L 280 105 L 320 100 L 360 95 L 360 180 L 40 180 Z"
              fill="#10b981"
              opacity="0.3"
            />
            
            {/* Lines */}
            <path
              d="M 40 120 L 80 110 L 120 90 L 160 70 L 200 85 L 240 75 L 280 65 L 320 60 L 360 55"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
            />
            <path
              d="M 40 140 L 80 135 L 120 125 L 160 115 L 200 120 L 240 110 L 280 105 L 320 100 L 360 95"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
            />
          </svg>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">New Admissions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Total Enrolled</span>
          </div>
        </div>
      </div>
    </div>
  );
};