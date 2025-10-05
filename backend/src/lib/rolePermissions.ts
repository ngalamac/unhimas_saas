import { PermissionMap } from '../types/permissions';

export type RoleType = 'SuperAdmin' | 'Admin' | 'Registrar' | 'Lecturer' | 'Accountant' | 'Dean of Studies' | 'Head Of Department';

// Default permission templates per role.
// SuperAdmin bypasses checks via isSuperAdmin flag; template mainly for UI reference.
export const rolePermissionTemplates: Record<RoleType, PermissionMap> = {
  SuperAdmin: {
    all: { read: true, write: true, create: true, update: true, delete: true, export: true, manage: true }
  },
  Admin: {
    branches: { read: true },
    students: { read: true, create: true, update: true, delete: true, export: true },
    tuition: { read: true, update: true },
    accounting: { read: true },
    backup: { read: true, create: true },
  },
  Registrar: {
    students: { read: true, create: true, update: true, delete: true, export: true },
    admissions: { read: true, update: true },
    departments: { read: true },
    programs: { read: true },
  },
  Lecturer: {
    students: { read: true },
    grades: { read: true, update: true },
  },
  Accountant: {
    accounting: { read: true, create: true, update: true, delete: true, export: true, reports: true },
    students: { read: true },
    tuition: { read: true, update: true },
  },
  'Dean of Studies': {
    students: { read: true, update: true, export: true },
    grades: { read: true, update: true },
    programs: { read: true, update: true },
    departments: { read: true },
  },
  'Head Of Department': {
    students: { read: true, update: true },
    programs: { read: true },
    grades: { read: true, update: true },
  }
};

export function getTemplateForRole(role: RoleType): PermissionMap {
  return rolePermissionTemplates[role] ? JSON.parse(JSON.stringify(rolePermissionTemplates[role])) : {};
}
