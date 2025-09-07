import React, { useState } from 'react';
import { Calculator, Settings, BookOpen, TrendingUp } from 'lucide-react';

export const GradingSystemPage: React.FC = () => {
  const [gradingType, setGradingType] = useState('Mark & GPA');
  const [caPercentage, setCaPercentage] = useState(30);
  const [examPercentage, setExamPercentage] = useState(70);

  const gradeScale = [
    { grade: 'A', minScore: 80, maxScore: 100, gpa: 4.0, description: 'Excellent' },
    { grade: 'B', minScore: 70, maxScore: 79, gpa: 3.0, description: 'Very Good' },
    { grade: 'C', minScore: 60, maxScore: 69, gpa: 2.0, description: 'Good' },
    { grade: 'D', minScore: 50, maxScore: 59, gpa: 1.0, description: 'Pass' },
    { grade: 'F', minScore: 0, maxScore: 49, gpa: 0.0, description: 'Fail' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grading System Configuration</h1>
        <p className="text-gray-600">Configure exam types, mark distribution, and grading scales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grading Configuration */}
        <div className="space-y-6">
          {/* Exam Types */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Exam Types</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grading System Type</label>
                <select
                  value={gradingType}
                  onChange={(e) => setGradingType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Mark">Mark Only (0-100)</option>
                  <option value="GPA">GPA Only (0-4.0)</option>
                  <option value="Mark & GPA">Mark & GPA Combined</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CA Percentage</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={caPercentage}
                      onChange={(e) => setCaPercentage(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Percentage</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={examPercentage}
                      onChange={(e) => setExamPercentage(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> CA (Continuous Assessment) + Exam must equal 100%. 
                  Exam marks will not be recorded without corresponding CA marks.
                </p>
              </div>
            </div>
          </div>

          {/* Mark Distribution Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Mark Distribution</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Raw Marks</p>
                  <p className="text-lg font-bold text-gray-900">0 - 100</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Average</p>
                  <p className="text-lg font-bold text-blue-900">0 - 20</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">GPA</p>
                  <p className="text-lg font-bold text-purple-900">0 - 4.0</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Calculation Formula:</h3>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  <p>Total Score = (CA × {caPercentage}%) + (Exam × {examPercentage}%)</p>
                  <p>Average = (Total Score ÷ 100) × 20</p>
                  <p>GPA = Grade Point based on Total Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Scale */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Grade Scale</h2>
          </div>

          <div className="space-y-3">
            {gradeScale.map((scale, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                    scale.grade === 'A' ? 'bg-green-500' :
                    scale.grade === 'B' ? 'bg-blue-500' :
                    scale.grade === 'C' ? 'bg-yellow-500' :
                    scale.grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                  }`}>
                    {scale.grade}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{scale.description}</p>
                    <p className="text-sm text-gray-600">
                      {scale.minScore} - {scale.maxScore} marks
                    </p>
                  
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{scale.gpa.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">GPA</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Credit Value Impact</h3>
            <p className="text-sm text-yellow-700">
              Each course has a credit value that affects the overall GPA calculation. 
              Higher credit courses have more weight in the final GPA computation.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>
    </div>
  );
};