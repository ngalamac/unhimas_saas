// Centralized role and permission definitions
export interface PermissionAction {
  id: string;
  name: string;
  description: string;
}

export interface PermissionFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  actions: PermissionAction[];
  icon: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  defaultPermissions: Record<string, string[]>;
  isSystemRole: boolean;
  hierarchy: number; // 1 = highest (SuperAdmin), 6 = lowest
}

export const permissionActions: PermissionAction[] = [
  { id: 'create', name: 'Create', description: 'Add new records' },
  { id: 'read', name: 'Read', description: 'View existing records' },
  { id: 'update', name: 'Update', description: 'Modify existing records' },
  { id: 'delete', name: 'Delete', description: 'Remove records' },
  { id: 'export', name: 'Export', description: 'Download data' },
  { id: 'approve', name: 'Approve', description: 'Authorize actions' },
  { id: 'restore', name: 'Restore', description: 'Restore deleted items' },
  { id: 'manage', name: 'Manage', description: 'Full management access' },
  { id: 'assign', name: 'Assign', description: 'Assign roles or resources' },
  { id: 'view', name: 'View', description: 'Access to view features' }
];

export const permissionFeatures: PermissionFeature[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Access to main dashboard and overview',
    category: 'Core',
    actions: [
      { id: 'view', name: 'View', description: 'Access dashboard' }
    ],
    icon: 'eye'
  },
  {
    id: 'students',
    name: 'Student Management',
    description: 'Manage student records and enrollment',
    category: 'Academic',
    actions: [
      { id: 'create', name: 'Create', description: 'Register new students' },
      { id: 'read', name: 'Read', description: 'View student records' },
      { id: 'update', name: 'Update', description: 'Modify student information' },
      { id: 'delete', name: 'Delete', description: 'Remove student records' },
      { id: 'export', name: 'Export', description: 'Export student data' },
      { id: 'restore', name: 'Restore', description: 'Restore deleted students' }
    ],
    icon: 'users'
  },
  {
    id: 'accounting',
    name: 'Accounting & Finance',
    description: 'Financial transactions and accounting',
    category: 'Financial',
    actions: [
      { id: 'create', name: 'Create', description: 'Record transactions' },
      { id: 'read', name: 'Read', description: 'View financial data' },
      { id: 'update', name: 'Update', description: 'Modify transactions' },
      { id: 'delete', name: 'Delete', description: 'Remove transactions' },
      { id: 'approve', name: 'Approve', description: 'Approve transactions' },
      { id: 'export', name: 'Export', description: 'Export financial reports' }
    ],
    icon: 'dollar-sign'
  },
  {
    id: 'staff',
    name: 'Staff Management',
    description: 'Staff and employee management',
    category: 'HR',
    actions: [
      { id: 'create', name: 'Create', description: 'Add new staff' },
      { id: 'read', name: 'Read', description: 'View staff records' },
      { id: 'update', name: 'Update', description: 'Modify staff information' },
      { id: 'delete', name: 'Delete', description: 'Remove staff records' },
      { id: 'export', name: 'Export', description: 'Export staff data' }
    ],
    icon: 'users'
  },
  {
    id: 'branches',
    name: 'Branch Management',
    description: 'Branch management and oversight',
    category: 'Administrative',
    actions: [
      { id: 'create', name: 'Create', description: 'Create new branches' },
      { id: 'read', name: 'Read', description: 'View branch information' },
      { id: 'update', name: 'Update', description: 'Modify branch details' },
      { id: 'delete', name: 'Delete', description: 'Remove branches' }
    ],
    icon: 'building'
  },
  {
    id: 'programs',
    name: 'Academic Programs',
    description: 'Academic programs and curriculum',
    category: 'Academic',
    actions: [
      { id: 'create', name: 'Create', description: 'Create new programs' },
      { id: 'read', name: 'Read', description: 'View programs' },
      { id: 'update', name: 'Update', description: 'Modify programs' },
      { id: 'delete', name: 'Delete', description: 'Remove programs' }
    ],
    icon: 'graduation-cap'
  },
  {
    id: 'departments',
    name: 'Departments',
    description: 'Department structure and management',
    category: 'Academic',
    actions: [
      { id: 'create', name: 'Create', description: 'Create departments' },
      { id: 'read', name: 'Read', description: 'View departments' },
      { id: 'update', name: 'Update', description: 'Modify departments' },
      { id: 'delete', name: 'Delete', description: 'Remove departments' }
    ],
    icon: 'building'
  },
  {
    id: 'courses',
    name: 'Course Management',
    description: 'Course management and scheduling',
    category: 'Academic',
    actions: [
      { id: 'create', name: 'Create', description: 'Create courses' },
      { id: 'read', name: 'Read', description: 'View courses' },
      { id: 'update', name: 'Update', description: 'Modify courses' },
      { id: 'delete', name: 'Delete', description: 'Remove courses' }
    ],
    icon: 'book-open'
  },
  {
    id: 'grades',
    name: 'Grading System',
    description: 'Student grades and assessments',
    category: 'Academic',
    actions: [
      { id: 'create', name: 'Create', description: 'Record grades' },
      { id: 'read', name: 'Read', description: 'View grades' },
      { id: 'update', name: 'Update', description: 'Modify grades' },
      { id: 'delete', name: 'Delete', description: 'Remove grades' }
    ],
    icon: 'award'
  },
  {
    id: 'attendance',
    name: 'Attendance System',
    description: 'Attendance tracking and QR codes',
    category: 'Academic',
    actions: [
      { id: 'create', name: 'Create', description: 'Record attendance' },
      { id: 'read', name: 'Read', description: 'View attendance' },
      { id: 'update', name: 'Update', description: 'Modify attendance' },
      { id: 'delete', name: 'Delete', description: 'Remove attendance records' }
    ],
    icon: 'qr-code'
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Announcements and messaging',
    category: 'Communication',
    actions: [
      { id: 'create', name: 'Create', description: 'Create announcements' },
      { id: 'read', name: 'Read', description: 'View messages' },
      { id: 'update', name: 'Update', description: 'Modify announcements' },
      { id: 'delete', name: 'Delete', description: 'Remove messages' }
    ],
    icon: 'message-square'
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'System reports and analytics',
    category: 'Analytics',
    actions: [
      { id: 'read', name: 'Read', description: 'View reports' },
      { id: 'export', name: 'Export', description: 'Export reports' }
    ],
    icon: 'bar-chart'
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'User account management',
    category: 'Security',
    actions: [
      { id: 'create', name: 'Create', description: 'Create user accounts' },
      { id: 'read', name: 'Read', description: 'View user accounts' },
      { id: 'update', name: 'Update', description: 'Modify user accounts' },
      { id: 'delete', name: 'Delete', description: 'Remove user accounts' },
      { id: 'manage', name: 'Manage', description: 'Full user management' }
    ],
    icon: 'user-check'
  },
  {
    id: 'roles',
    name: 'Role Management',
    description: 'Role and permission management',
    category: 'Security',
    actions: [
      { id: 'create', name: 'Create', description: 'Create roles' },
      { id: 'read', name: 'Read', description: 'View roles' },
      { id: 'update', name: 'Update', description: 'Modify roles' },
      { id: 'delete', name: 'Delete', description: 'Remove roles' },
      { id: 'assign', name: 'Assign', description: 'Assign roles to users' }
    ],
    icon: 'shield'
  }
];

export const roleDefinitions: RoleDefinition[] = [
  {
    id: 'SuperAdmin',
    name: 'Super Administrator',
    description: 'Complete system access and control',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'shield',
    defaultPermissions: { all: ['*'] },
    isSystemRole: true,
    hierarchy: 1
  },
  {
    id: 'Admin',
    name: 'Branch Administrator',
    description: 'Branch-level administrative access',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'building',
    defaultPermissions: {
      students: ['create', 'read', 'update', 'delete', 'export'],
      accounting: ['create', 'read', 'update', 'export'],
      staff: ['read', 'update'],
      programs: ['read', 'update'],
      departments: ['read', 'update'],
      communication: ['create', 'read', 'update', 'delete'],
      reports: ['read', 'export']
    },
    isSystemRole: true,
    hierarchy: 2
  },
  {
    id: 'Lecturer',
    name: 'Academic Lecturer',
    description: 'Teaching and academic management',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: 'graduation-cap',
    defaultPermissions: {
      students: ['read', 'update'],
      courses: ['read', 'update'],
      grades: ['create', 'read', 'update'],
      attendance: ['create', 'read', 'update'],
      reports: ['read']
    },
    isSystemRole: true,
    hierarchy: 4
  },
  {
    id: 'Accountant',
    name: 'Financial Officer',
    description: 'Financial management and accounting',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: 'dollar-sign',
    defaultPermissions: {
      accounting: ['create', 'read', 'update', 'delete', 'approve', 'export'],
      students: ['read'],
      reports: ['read', 'export']
    },
    isSystemRole: true,
    hierarchy: 3
  },
  {
    id: 'Dean of Studies',
    name: 'Dean of Studies',
    description: 'Academic oversight and program management',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: 'graduation-cap',
    defaultPermissions: {
      students: ['read', 'update', 'export'],
      programs: ['create', 'read', 'update', 'delete'],
      departments: ['create', 'read', 'update', 'delete'],
      courses: ['create', 'read', 'update', 'delete'],
      grades: ['read', 'update'],
      reports: ['read', 'export']
    },
    isSystemRole: true,
    hierarchy: 3
  },
  {
    id: 'Head Of Department',
    name: 'Head of Department',
    description: 'Department-specific management',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: 'users',
    defaultPermissions: {
      students: ['read', 'update'],
      courses: ['read', 'update'],
      grades: ['read', 'update'],
      attendance: ['read', 'update'],
      reports: ['read']
    },
    isSystemRole: true,
    hierarchy: 5
  }
];

export const getPermissionsByRole = (roleId: string): Record<string, string[]> => {
  const role = roleDefinitions.find(r => r.id === roleId);
  return role?.defaultPermissions || {};
};

export const hasPermission = (userPermissions: Record<string, Record<string, boolean>>, feature: string, action: string): boolean => {
  // Check for all permissions
  if (userPermissions.all && userPermissions.all['*']) return true;
  
  // Check specific feature and action
  return userPermissions[feature]?.[action] || false;
};

export const getRoleHierarchy = (roleId: string): number => {
  const role = roleDefinitions.find(r => r.id === roleId);
  return role?.hierarchy || 999;
};

export const canManageRole = (managerRole: string, targetRole: string): boolean => {
  const managerHierarchy = getRoleHierarchy(managerRole);
  const targetHierarchy = getRoleHierarchy(targetRole);
  
  // Lower hierarchy number = higher authority
  return managerHierarchy < targetHierarchy;
};

export const getAvailableRolesForUser = (userRole: string): RoleDefinition[] => {
  if (userRole === 'SuperAdmin') {
    return roleDefinitions;
  }
  
  const userHierarchy = getRoleHierarchy(userRole);
  return roleDefinitions.filter(role => role.hierarchy > userHierarchy);
};

export const formatPermissions = (permissions: Record<string, Record<string, boolean>>): string => {
  if (permissions.all && permissions.all['*']) return 'Full Access';
  
  const totalActions = Object.values(permissions).reduce((sum, actions) => 
    sum + Object.values(actions).filter(Boolean).length, 0
  );
  const totalFeatures = Object.keys(permissions).length;
  
  return `${totalActions} actions across ${totalFeatures} features`;
};