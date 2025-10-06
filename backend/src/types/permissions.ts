// Central permission type definitions
// Extend Feature and Action unions as new domains are added.

export type Feature =
  | 'all'
  | 'branches'
  | 'students'
  | 'programs'
  | 'departments'
  | 'paymentPlans'
  | 'tuition'
  | 'uploads'
  | 'accounting'
  | 'grades'
  | 'backup'
  | 'admissions'
  | 'users';

export type Action = 'read' | 'write' | 'create' | 'update' | 'delete' | 'export' | 'manage' | 'reports' | 'stats' | 'upload';

export type PermissionMap = {
  [F in Feature]?: Partial<Record<Action, boolean>>;
};

export interface PermissionCheckContext {
  userId: string;
  type?: string;
  branch?: string;
  permissions?: PermissionMap;
}

export function hasPermission(permissions: PermissionMap | undefined, perm: string): boolean {
  if (!permissions) return false;
  const [feature, action] = perm.split(':');
  if (!feature || !action) return false;
  if (action === '*') {
    const featurePerms = permissions[feature as Feature];
    return !!featurePerms && Object.values(featurePerms).some(Boolean);
  }
  if (feature === '*') {
    return Object.values(permissions).some(fp => !!fp && (fp as any)[action]);
  }
  return !!permissions[feature as Feature]?.[action as Action];
}
