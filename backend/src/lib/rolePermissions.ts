import { PermissionMap } from '../types/permissions';

export type RoleType = 'SuperAdmin' | 'Admin' | 'Registrar' | 'Lecturer' | 'Accountant' | 'Dean of Studies' | 'Head Of Department';

// Default permission templates per role.
// SuperAdmin bypasses checks via isSuperAdmin flag; template mainly for UI reference.
export const rolePermissionTemplates: Record<RoleType, PermissionMap> = {
  SuperAdmin: {
    all: {
      read: true,
      write: true,
      create: true,
      update: true,
      delete: true,
      export: true,
      manage: true,
      reports: true,
      stats: true,
      upload: true,
      approve: true
    }
  },
  Admin: {
    // Branch manager: single-branch scope enforced by middleware
    branches: { read: true, update: true },
    students: { read: true, create: true, update: true, delete: true, export: true },
    staff: { read: true, create: true, update: true },
    accounting: { read: true, export: true, reports: true },
    grades: { read: true },
    programs: { read: true },
    departments: { read: true }
  },
  Registrar: {
    students: { read: true, create: true, update: true, delete: true, export: true },
    admissions: { read: true, create: true, update: true },
    grades: { read: true, update: true },
    programs: { read: true },
    departments: { read: true }
  },
  Lecturer: {
    students: { read: true },
    grades: { read: true, update: true },
    staff: { read: true },
  },
  Accountant: {
    accounting: { read: true, create: true, update: true, delete: true, export: true, reports: true, approve: true },
    students: { read: true },
    tuition: { read: true, update: true },
    staff: { read: true },
  },
  'Dean of Studies': {
    students: { read: true, update: true, export: true },
    grades: { read: true, update: true },
    programs: { read: true, update: true },
    departments: { read: true },
    courses: { read: true, update: true },
    staff: { read: true }
  },
  'Head Of Department': {
    students: { read: true, update: true },
    programs: { read: true },
    grades: { read: true, update: true },
    courses: { read: true, update: true },
    staff: { read: true },
  }
};

export function getTemplateForRole(role: RoleType): PermissionMap {
  return rolePermissionTemplates[role] ? JSON.parse(JSON.stringify(rolePermissionTemplates[role])) : {};
}
