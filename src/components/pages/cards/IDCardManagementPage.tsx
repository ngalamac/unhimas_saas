import React, { useState } from 'react';
import { CreditCard, Download, Eye, Plus, Settings, Users, GraduationCap } from 'lucide-react';

export const IDCardManagementPage: React.FC = () => {
  const [selectedCardType, setSelectedCardType] = useState('student');
  const [selectedTemplate, setSelectedTemplate] = useState('template1');

  const cardTypes = [
    { id: 'student', name: 'Student ID Cards', icon: GraduationCap, count: 1247 },
    { id: 'employee', name: 'Employee ID Cards', icon: Users, count: 89 },
    { id: 'admit', name: 'Admit Cards', icon: CreditCard, count: 156 },
    { id: 'certificate', name: 'Certificates', icon: GraduationCap, count: 234 }
  ];

  const templates = [
    { id: 'template1', name: 'Standard Blue', preview: '/api/placeholder/200/120' },
    { id: 'template2', name: 'Modern Red', preview: '/api/placeholder/200/120' },
    { id: 'template3', name: 'Classic Green', preview: '/api/placeholder/200/120' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ID Card Management</h1>
        <p className="text-gray-600">Generate and manage student and employee ID cards</p>
      </div>

      {/* Card Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {cardTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedCardType(type.id)}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedCardType === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedCardType === type.id ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <type.icon className={`w-5 h-5 ${
                  selectedCardType === type.id ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{type.name}</p>
                <p className="text-sm text-gray-600">{type.count} cards</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Card Templates</h2>
          </div>

          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-10 bg-gray-200 rounded border flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{template.name}</p>
                    <p className="text-sm text-gray-600">Template</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </button>
        </div>

        {/* Card Preview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Card Preview</h2>
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">UNHIMAS</h3>
                <p className="text-sm opacity-90">Student ID Card</p>
              </div>
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-16 h-20 bg-gray-300 rounded border"></div>
              <div>
                <p className="font-semibold">John Doe</p>
                <p className="text-sm opacity-90">Computer Engineering</p>
                <p className="text-sm opacity-90">ID: STU-2024-001</p>
                <p className="text-sm opacity-90">Level 2</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="w-full h-8 bg-white/20 rounded flex items-center justify-center">
                <span className="text-xs font-mono">QR CODE</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Bulk Generation */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Generation</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipients</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Choose group...</option>
                <option value="all-students">All Students</option>
                <option value="level-1">Level 1 Students</option>
                <option value="level-2">Level 2 Students</option>
                <option value="hnd-students">HND Students</option>
                <option value="bachelor-students">Bachelor Students</option>
                <option value="all-staff">All Staff</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Format</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pdf">PDF (Printable)</option>
                <option value="png">PNG (Digital)</option>
                <option value="jpg">JPG (Digital)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="include-qr" className="rounded" />
              <label htmlFor="include-qr" className="text-sm text-gray-700">Include QR Code</label>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="include-barcode" className="rounded" />
              <label htmlFor="include-barcode" className="text-sm text-gray-700">Include Barcode</label>
            </div>

            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Generate Cards</span>
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Generation Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-700">Last Generation:</span>
                <span className="text-yellow-900">Dec 15, 2024</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-700">Cards Generated:</span>
                <span className="text-yellow-900">156 cards</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-700">Status:</span>
                <span className="text-green-600 font-medium">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};