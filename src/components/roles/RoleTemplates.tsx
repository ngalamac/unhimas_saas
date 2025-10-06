import React, { useState, useEffect } from 'react';
import { Shield, Users, GraduationCap, DollarSign, Building2, Copy, Plus, Trash2, X, Edit } from 'lucide-react';
import fetchClient from '../../lib/fetchClient';
import { dispatchPermissionsUpdated } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { listRoleTemplates, setRoleDefaultTemplate } from '../../api/roleTemplates';

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  permissions: Record<string, string[]>;
  userCount: number;
  isDefault: boolean;
  role?: string;
}

// Available features/actions for template editing (align with Permission Matrix)
const AVAILABLE_FEATURES: Array<{ feature: string; actions: string[]; title: string }> = [
  { feature: 'students', actions: ['create','read','update','delete','export'], title: 'Students' },
  { feature: 'admissions', actions: ['create','read','update','delete'], title: 'Admissions' },
  { feature: 'accounting', actions: ['create','read','update','delete','approve','export'], title: 'Accounting' },
  { feature: 'staff', actions: ['create','read','update','delete','export'], title: 'Staff' },
  { feature: 'branches', actions: ['create','read','update','delete'], title: 'Branches' },
  { feature: 'programs', actions: ['create','read','update','delete'], title: 'Programs' },
  { feature: 'departments', actions: ['create','read','update','delete'], title: 'Departments' },
  { feature: 'courses', actions: ['create','read','update','delete'], title: 'Courses' },
  { feature: 'grades', actions: ['create','read','update','delete'], title: 'Grades' },
  { feature: 'attendance', actions: ['create','read','update','delete'], title: 'Attendance' },
  { feature: 'communication', actions: ['create','read','update','delete'], title: 'Communication' },
  { feature: 'reports', actions: ['read','export'], title: 'Reports' },
  { feature: 'users', actions: ['create','read','update','delete','manage'], title: 'Users' },
  { feature: 'backup', actions: ['create','read','update','delete','export'], title: 'Backup' },
];

const defaultRoleTemplates: RoleTemplate[] = [
  {
    id: 'superadmin',
    name: 'Super Administrator',
    description: 'Complete system access and control',
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: { all: ['*'] },
  userCount: 0, // dynamic
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
  userCount: 0,
    isDefault: true
  },
  {
    id: 'registrar',
    name: 'Registrar',
    description: 'Admissions and student records',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    permissions: {
      students: ['create', 'read', 'update', 'delete', 'export'],
      admissions: ['read', 'update'],
      departments: ['read'],
      programs: ['read']
    },
    userCount: 0,
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
  userCount: 0,
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
  userCount: 0,
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
  userCount: 0,
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
  userCount: 0,
    isDefault: true
  }
];

const RoleTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<RoleTemplate[]>(defaultRoleTemplates);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    permissions: {} as Record<string, string[]>
  });
  const [users, setUsers] = useState<any[]>([]); // user list for apply modal
  const [applyTemplate, setApplyTemplate] = useState<RoleTemplate | null>(null);
  const [detailsTemplate, setDetailsTemplate] = useState<RoleTemplate | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [applying, setApplying] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; description: string }>({ name: '', description: '' });
  const [editPerms, setEditPerms] = useState<Record<string, string[]>>({});
  const [createPerms, setCreatePerms] = useState<Record<string, string[]>>({});
  const { showToast } = useUI();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchClient.get('/api/users?limit=500');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
        }
        // Load current role defaults from backend and merge into UI templates
        try {
          const tpls = await listRoleTemplates();
          const fromBackend = (tpls.data || []).map(rt => mapBackendTemplateToUI(rt as any));
          setTemplates(prev => mergeTemplates(prev, fromBackend));
        } catch (_) {}
      } catch (_) {}
    };
    load();
  }, []);

  // Map template id to backend user.type strings
  const templateIdToType: Record<string, string> = {
    superadmin: 'SuperAdmin',
    admin: 'Admin',
    registrar: 'Registrar',
    lecturer: 'Lecturer',
    accountant: 'Accountant',
    dean: 'Dean of Studies',
    hod: 'Head Of Department'
  };

  const getDynamicUserCount = (template: RoleTemplate): number => {
    const type = templateIdToType[template.id];
    if (!type) return 0;
    return users.filter(u => u.type === type).length;
  };

  const buildPermissionMap = (perm: Record<string, string[]>): Record<string, Record<string, boolean>> => {
    if (perm.all) return { all: { '*': true } } as any;
    const map: Record<string, Record<string, boolean>> = {};
    Object.entries(perm).forEach(([feature, actions]) => {
      map[feature.toLowerCase()] = {};
      actions.forEach(a => { map[feature.toLowerCase()][a.toLowerCase()] = true; });
    });
    return map;
  };

  const isChecked = (perms: Record<string, string[]>, feature: string, action: string) => {
    return (perms[feature] || []).includes(action);
  };

  const toggleAction = (
    setter: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
    perms: Record<string, string[]>,
    feature: string,
    action: string
  ) => {
    setter(prev => {
      const current = prev[feature] || [];
      const next = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...prev, [feature]: next };
    });
  };

  const setAllForFeature = (
    setter: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
    feature: string,
    actions: string[],
    value: boolean
  ) => {
    setter(prev => ({ ...prev, [feature]: value ? [...actions] : [] }));
  };

  const mapBackendTemplateToUI = (rt: { role: string; permissions: Record<string, Record<string, boolean>>; isDefault: boolean; updatedAt?: string; }): RoleTemplate => {
    const toStringArrays: Record<string, string[]> = {};
    Object.entries(rt.permissions || {}).forEach(([feature, actions]) => {
      const arr = Object.entries(actions || {})
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (arr.length > 0) toStringArrays[feature] = arr;
    });
    const id = roleToId(rt.role);
    const meta = idToMeta(id);
    return {
      id,
      role: rt.role,
      name: meta.name,
      description: meta.description,
      icon: meta.icon,
      color: meta.color,
      permissions: toStringArrays,
      userCount: 0,
      isDefault: !!rt.isDefault,
    };
  };

  const roleToId = (role: string): string => {
    const map: Record<string, string> = {
      SuperAdmin: 'superadmin',
      Admin: 'admin',
      Registrar: 'registrar',
      Lecturer: 'lecturer',
      Accountant: 'accountant',
      'Dean of Studies': 'dean',
      'Head Of Department': 'hod',
    };
    return map[role] || role.toLowerCase().replace(/\s+/g, '-');
  };

  const idToMeta = (id: string) => {
    switch (id) {
      case 'superadmin': return { name: 'Super Administrator', description: 'Complete system access and control', icon: <Shield className="w-5 h-5" />, color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'admin': return { name: 'Branch Administrator', description: 'Branch-level administrative access', icon: <Building2 className="w-5 h-5" />, color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'registrar': return { name: 'Registrar', description: 'Admissions and student records', icon: <Users className="w-5 h-5" />, color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'lecturer': return { name: 'Academic Lecturer', description: 'Teaching and academic management', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-green-100 text-green-800 border-green-200' };
      case 'accountant': return { name: 'Financial Officer', description: 'Financial management and accounting', icon: <DollarSign className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'dean': return { name: 'Dean of Studies', description: 'Academic oversight and program management', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'hod': return { name: 'Head of Department', description: 'Department-specific management', icon: <Users className="w-5 h-5" />, color: 'bg-pink-100 text-pink-800 border-pink-200' };
      default: return { name: id, description: 'Custom role', icon: <Shield className="w-5 h-5" />, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const mergeTemplates = (base: RoleTemplate[], incoming: RoleTemplate[]) => {
    const byId: Record<string, RoleTemplate> = {};
    base.forEach(t => { byId[t.id] = t; });
    incoming.forEach(t => { byId[t.id] = { ...byId[t.id], ...t }; });
    return Object.values(byId);
  };

  const handleApplyTemplate = async () => {
    if (!applyTemplate || !selectedUserId) return;
    if (selectedUserId === currentUser?.id) {
      showToast('Cannot modify your own permissions', 'error');
      return;
    }
    setApplying(true);
    try {
      const permissionMap = buildPermissionMap(applyTemplate.permissions);
      const res = await fetchClient.put(`/api/users/${selectedUserId}/permissions`, {
        permissions: permissionMap,
        replace: true
      });
      if (res.ok) {
        showToast('Template applied successfully', 'success');
        dispatchPermissionsUpdated({ userId: selectedUserId, template: applyTemplate.id });
        setApplyTemplate(null);
        setSelectedUserId('');
      } else {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.error || 'Failed to apply template');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setApplying(false);
    }
  };

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
      permissions: createPerms,
      userCount: 0,
      isDefault: false
    };

    setTemplates(prev => [...prev, template]);
    setShowCreateModal(false);
    setNewTemplate({ name: '', description: '', permissions: {} });
    setCreatePerms({});
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

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string; name?: string }>({ open: false });
  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) {
      showToast('Cannot delete default templates', 'error');
      return;
    }
    setConfirmDelete({ open: true, id: templateId, name: template?.name });
  };

  const handleEditTemplate = (template: RoleTemplate) => {
    setEditingTemplate(template);
    setEditDraft({ name: template.name, description: template.description });
    setEditPerms(template.permissions || {});
  };

  const handleSaveEdit = () => {
    if (!editingTemplate) return;
    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, name: editDraft.name, description: editDraft.description, permissions: editPerms } : t));
    setEditingTemplate(null);
  };

  const handleSetDefault = async (template: RoleTemplate) => {
    try {
      const role = template.role || templateIdToType[template.id];
      if (!role) return;
      const permissionMap = buildPermissionMap(template.permissions);
      await setRoleDefaultTemplate(role, permissionMap);
      setTemplates(prev => prev.map(t => (
        (templateIdToType[t.id] || t.role) === role
          ? { ...t, isDefault: t.id === template.id }
          : t
      )));
    } catch (_) {}
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
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    title="Edit template"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!template.isDefault && (
                    <>
                      {/* Edit functionality reserved for future implementation */}
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
                  <span className="font-medium text-gray-900">{getDynamicUserCount(template)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Permissions:</span>
                  <span className="font-medium text-gray-900">{getPermissionCount(template.permissions)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button onClick={() => { setApplyTemplate(template); }} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                    Apply to User
                  </button>
                  <button onClick={() => setDetailsTemplate(template)} className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
                    View Details
                  </button>
                  <button onClick={() => handleSetDefault(template)} className={`flex-1 px-3 py-2 rounded-lg text-sm ${template.isDefault ? 'bg-green-100 text-green-700 border border-green-200' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    {template.isDefault ? 'Default' : 'Set as Default'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-4 max-h-[50vh] overflow-auto border rounded-lg p-3">
                  {AVAILABLE_FEATURES.map(({ feature, actions, title }) => (
                    <div key={feature} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 capitalize">{title}</div>
                        <div className="space-x-2 text-xs">
                          <button onClick={() => setAllForFeature(setCreatePerms, feature, actions, true)} className="px-2 py-1 border rounded">All</button>
                          <button onClick={() => setAllForFeature(setCreatePerms, feature, actions, false)} className="px-2 py-1 border rounded">Clear</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {actions.map(a => (
                          <label key={a} className="inline-flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isChecked(createPerms, feature, a)}
                              onChange={() => toggleAction(setCreatePerms, createPerms, feature, a)}
                            />
                            <span className="capitalize">{a}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* Apply Template Modal */}
      {applyTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Apply Template: {applyTemplate.name}</h3>
              <button onClick={() => { if(!applying){ setApplyTemplate(null); setSelectedUserId(''); } }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose User --</option>
                  {users.filter(u => u.type !== 'SuperAdmin').map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-500">
                Applying this template will overwrite the user's existing permissions. This cannot be undone.
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => { if(!applying){ setApplyTemplate(null); setSelectedUserId(''); } }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={applying}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTemplate}
                disabled={!selectedUserId || applying}
                className={`px-4 py-2 rounded-lg text-white ${!selectedUserId || applying ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {applying ? 'Applying...' : 'Apply Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{detailsTemplate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{detailsTemplate.description}</p>
              </div>
              <button onClick={() => setDetailsTemplate(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {detailsTemplate.permissions.all ? (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
                  Full system access (all permissions)
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(detailsTemplate.permissions).map(([feature, actions]) => (
                    <div key={feature} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">{feature}</h4>
                        <span className="text-xs text-gray-500">{actions.length} actions</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {actions.map(a => (
                          <span key={a} className="inline-flex items-center space-x-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            <span>{a}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button onClick={() => setDetailsTemplate(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
              <button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input value={editDraft.name} onChange={(e)=>setEditDraft(prev=>({...prev, name: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={editDraft.description} onChange={(e)=>setEditDraft(prev=>({...prev, description: e.target.value}))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-4 max-h-[50vh] overflow-auto border rounded-lg p-3">
                  {AVAILABLE_FEATURES.map(({ feature, actions, title }) => (
                    <div key={feature} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 capitalize">{title}</div>
                        <div className="space-x-2 text-xs">
                          <button onClick={() => setAllForFeature(setEditPerms, feature, actions, true)} className="px-2 py-1 border rounded">All</button>
                          <button onClick={() => setAllForFeature(setEditPerms, feature, actions, false)} className="px-2 py-1 border rounded">Clear</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {actions.map(a => (
                          <label key={a} className="inline-flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isChecked(editPerms, feature, a)}
                              onChange={() => toggleAction(setEditPerms, editPerms, feature, a)}
                            />
                            <span className="capitalize">{a}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={()=>setEditingTemplate(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Confirm template delete modal */}
    {confirmDelete.open && (
      <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete role template</h3>
          <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete {confirmDelete.name || 'this template'}?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDelete({ open: false })} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={() => { const id = confirmDelete.id!; setConfirmDelete({ open: false }); setTemplates(prev => prev.filter(t => t.id !== id)); showToast('Template deleted successfully', 'success'); }} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
          </div>
        </div>
      </div>
    )}
  );
};

export default RoleTemplates;