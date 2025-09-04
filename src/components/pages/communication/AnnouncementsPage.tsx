import React, { useState } from 'react';
import { Megaphone, Plus, Eye, Edit, Trash2, Send, Calendar, Users } from 'lucide-react';
import { mockAnnouncements } from '../../../data/mockData';
import { Announcement } from '../../../types/school';

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'Sent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'Students': return '🎓';
      case 'Staff': return '👨‍💼';
      case 'Parents': return '👨‍👩‍👧‍👦';
      default: return '📢';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Create and manage school announcements</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Announcements</p>
              <p className="text-xl font-bold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-xl font-bold text-gray-900">
                {announcements.filter(a => a.status === 'Sent').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-xl font-bold text-gray-900">
                {announcements.filter(a => a.status === 'Scheduled').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Edit className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-xl font-bold text-gray-900">
                {announcements.filter(a => a.status === 'Draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Announcements</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getAudienceIcon(announcement.targetAudience)}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(announcement.status)}`}>
                      {announcement.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{announcement.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{announcement.targetAudience}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {announcement.scheduledFor 
                          ? `Scheduled for ${new Date(announcement.scheduledFor).toLocaleDateString()}`
                          : `Created ${new Date(announcement.createdAt).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                    <span>By {announcement.createdBy}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <Edit className="w-4 h-4" />
                  </button>
                  {announcement.status === 'Draft' && (
                    <button className="text-purple-600 hover:text-purple-900">
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Form Modal (simplified) */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Announcement</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="All">All Users</option>
                  <option value="Students">Students</option>
                  <option value="Staff">Staff</option>
                  <option value="Parents">Parents</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement content"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule For (Optional)</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                Save as Draft
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};