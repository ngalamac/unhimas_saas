import React, { useState } from 'react';
import { Shield, Users, GraduationCap, DollarSign, Building2, Copy, Plus, Edit, Trash2 } from 'lucide-react';
import { useUI } from '../../context/UIContext';

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  permissions: Record<string, string[]>;
  userCount: number;
  isDefault: boolean;
}

const defaultRoleTemplates: RoleTemplate[] = [
  {
    id: 'superadmin',
    name: 'Super Administrator',
    description: 'Complete system access and control',
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: { all: ['*'] },
    userCount: 1,
    isDefault: true
  },
  {
    id: 'admin',
    name: 'Branch Administrator',
    description: 'Branch-level administrative access',
    icon: <Building2 className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: {
      students: ['create', 'read', 'update', 'delete', 'export'],
      accounting: ['create', 'read', 'update', 'export'],
      staff: ['read', 'update'],
      programs: ['read', 'update'],
      departments: ['read', 'update'],
      communication: ['create', 'read', 'update', 'delete'],
      reports: ['read', 'export']
    },
    userCount: 8,
    isDefault: true
  },
  {
    id: 'lecturer',
    name: 'Academic Lecturer',
    description: 'Teaching and academic management',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'bg-green-100 text-green-800 border-green-200',
    permissions: {
      students: ['read', 'update'],
      courses: ['read', 'update'],
      grades: ['create', 'read', 'update'],
      attendance: ['create', 'read', 'update'],
      reports: ['read']
    },
    userCount: 45,
    isDefault: true
  },
  {
    id: 'accountant',
    name: 'Financial Officer',
    description: 'Financial management and accounting',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    permissions: {
      accounting: ['create', 'read', 'update', 'delete', 'approve', 'export'],
      students: ['read'],
      reports: ['read', 'export']
    },
    userCount: 12,
    isDefault: true
  },
  {
    id: 'dean',
    name: 'Dean of Studies',
    description: 'Academic oversight and program management',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    permissions: {
      students: ['read', 'update', 'export'],
      programs: ['create', 'read', 'update', 'delete'],
      departments: ['create', 'read', 'update', 'delete'],
      courses: ['create', 'read', 'update', 'delete'],
      grades: ['read', 'update'],
      reports: ['read', 'export']
    },
    userCount: 3,
    isDefault: true
  },
  {
    id: 'hod',
    name: 'Head of Department',
    description: 'Department-specific management',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    permissions: {
      students: ['read', 'update'],
      courses: ['read', 'update'],
      grades: ['read', 'update'],
      attendance: ['read', 'update'],
      reports: ['read']
    },
    userCount: 6,
    isDefault: true
  }
];

const RoleTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<RoleTemplate[]>(defaultRoleTemplates);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    permissions: {} as Record<string, string[]>
  });
  const { showToast } = useUI();

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) {
      showToast('Template name is required', 'error');
      return;
    }

    const template: RoleTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      icon: <Shield className="w-5 h-5" />,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      permissions: newTemplate.permissions,
      userCount: 0,
      isDefault: false
    };

    setTemplates(prev => [...prev, template]);
    setShowCreateModal(false);
    setNewTemplate({ name: '', description: '', permissions: {} });
    showToast('Role template created successfully', 'success');
  };

  const handleDuplicateTemplate = (template: RoleTemplate) => {
    const duplicated: RoleTemplate = {
      ...template,
      id: `copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      userCount: 0,
      isDefault: false
    };

    setTemplates(prev => [...prev, duplicated]);
    showToast('Template duplicated successfully', 'success');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) {
      showToast('Cannot delete default templates', 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this role template?')) return;

    setTemplates(prev => prev.filter(t => t.id !== templateId));
    showToast('Template deleted successfully', 'success');
  };

  const getPermissionCount = (permissions: Record<string, string[]>) => {
    if (permissions.all) return 'All Permissions';
    return Object.values(permissions).flat().length + ' permissions';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Templates</h2>
          <p className="text-gray-600 mt-1">Pre-configured role templates for quick user setup</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${template.color.split(' ')[0]}-100`}>
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.isDefault && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    title="Duplicate template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {!template.isDefault && (
                    <>
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                        title="Edit template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{template.description}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Users with this role:</span>
                  <span className="font-medium text-gray-900">{template.userCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Permissions:</span>
                  <span className="font-medium text-gray-900">{getPermissionCount(template.permissions)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                    Apply to User
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Role Template</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Custom Administrator"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the role and its responsibilities"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleTemplates;