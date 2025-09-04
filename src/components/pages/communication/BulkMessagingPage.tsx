import React, { useState } from 'react';
import { MessageSquare, Users, Send, Calendar, Mail, Smartphone } from 'lucide-react';

export const BulkMessagingPage: React.FC = () => {
  const [messageType, setMessageType] = useState('SMS');
  const [targetAudience, setTargetAudience] = useState('All');
  const [message, setMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const userGroups = [
    { id: 'all', name: 'All Users', count: 1356 },
    { id: 'students', name: 'All Students', count: 1247 },
    { id: 'staff', name: 'All Staff', count: 89 },
    { id: 'parents', name: 'All Parents', count: 856 },
    { id: 'hnd-students', name: 'HND Students', count: 498 },
    { id: 'bachelor-students', name: 'Bachelor Students', count: 561 },
    { id: 'masters-students', name: 'Masters Students', count: 188 },
    { id: 'day-session', name: 'Day Session Students', count: 892 },
    { id: 'evening-session', name: 'Evening Session Students', count: 355 }
  ];

  const handleSendMessage = () => {
  // Sending message handler -- logging removed to reduce console noise
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Messaging</h1>
        <p className="text-gray-600">Send SMS and email messages to user groups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Type */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMessageType('SMS')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  messageType === 'SMS'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">SMS</p>
                    <p className="text-sm text-gray-600">Text message</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMessageType('Email')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  messageType === 'Email'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">Email message</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h2>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.count} recipients)
                </option>
              ))}
            </select>
          </div>

          {/* Message Content */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Content</h2>
            {messageType === 'Email' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message {messageType === 'SMS' && '(160 characters max)'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={messageType === 'SMS' ? 4 : 8}
                maxLength={messageType === 'SMS' ? 160 : undefined}
                placeholder={`Enter your ${messageType.toLowerCase()} message here...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {messageType === 'SMS' && (
                <p className="text-sm text-gray-500 mt-1">
                  {message.length}/160 characters
                </p>
              )}
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Message</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Leave empty to send immediately
            </p>
          </div>

          {/* Send Button */}
          <div className="flex justify-end space-x-4">
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Save as Draft
            </button>
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{scheduleDate ? 'Schedule Message' : 'Send Now'}</span>
            </button>
          </div>
        </div>

        {/* User Groups Sidebar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">User Groups</h2>
          </div>

          <div className="space-y-3">
            {userGroups.map(group => (
              <div
                key={group.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  targetAudience === group.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setTargetAudience(group.id)}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{group.name}</p>
                  <span className="text-sm text-gray-600">{group.count}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Message Credits</h3>
            <p className="text-sm text-yellow-700">
              SMS: 2,450 credits remaining<br />
              Email: Unlimited
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};