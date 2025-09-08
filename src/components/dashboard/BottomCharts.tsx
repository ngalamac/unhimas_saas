import React from 'react';

export const BottomCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Program Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Program Distribution</h3>
        <div className="flex items-center justify-center h-64">
          {/* Donut Chart Placeholder */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="12"
              />
              {/* HND segment - 40% */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeDasharray="87.9 219.8"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Bachelor segment - 45% */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray="98.9 219.8"
                strokeDashoffset="-87.9"
                strokeLinecap="round"
              />
              {/* Masters segment - 15% */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray="33 219.8"
                strokeDashoffset="-186.8"
                strokeLinecap="round"
              />
            </svg>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4 mt-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">HND (498)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Bachelor (561)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Masters (188)</span>
          </div>
        </div>
      </div>

      {/* Academic Performance Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Performance Analysis</h3>
        <div className="h-64">
          {/* Bar Chart Placeholder */}
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            <defs>
              <pattern id="grid2" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
            
            {/* Y-axis labels */}
            <text x="10" y="20" className="text-xs fill-gray-500">4.0</text>
            <text x="10" y="50" className="text-xs fill-gray-500">3.5</text>
            <text x="10" y="80" className="text-xs fill-gray-500">3.0</text>
            <text x="10" y="110" className="text-xs fill-gray-500">2.5</text>
            <text x="10" y="140" className="text-xs fill-gray-500">2.0</text>
            <text x="10" y="170" className="text-xs fill-gray-500">1.5</text>
            <text x="10" y="200" className="text-xs fill-gray-500">1.0</text>
            
            {/* Department bars */}
            <rect x="50" y="60" width="25" height="120" fill="#3b82f6" opacity="0.8"/>
            <rect x="90" y="80" width="25" height="100" fill="#10b981" opacity="0.8"/>
            <rect x="130" y="70" width="25" height="110" fill="#f59e0b" opacity="0.8"/>
            <rect x="170" y="90" width="25" height="90" fill="#ef4444" opacity="0.8"/>
            <rect x="210" y="75" width="25" height="105" fill="#8b5cf6" opacity="0.8"/>
            <rect x="250" y="85" width="25" height="95" fill="#06b6d4" opacity="0.8"/>
            
            {/* X-axis labels */}
            <text x="45" y="195" className="text-xs fill-gray-500">CS</text>
            <text x="85" y="195" className="text-xs fill-gray-500">HR</text>
            <text x="125" y="195" className="text-xs fill-gray-500">ACC</text>
            <text x="165" y="195" className="text-xs fill-gray-500">TL</text>
            <text x="205" y="195" className="text-xs fill-gray-500">ENG</text>
            <text x="245" y="195" className="text-xs fill-gray-500">BUS</text>
          </svg>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Average GPA</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Pass Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};