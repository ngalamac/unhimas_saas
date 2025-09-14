// Utility functions for permission normalization and summaries
// Ensures consistent lowercase keys and removal of empty features

export interface NestedPermissions { [feature: string]: { [action: string]: boolean } }

// Normalize incoming permission map: lowercase everything, drop false/empty
export function normalizePermissions(input: any): NestedPermissions {
  const result: NestedPermissions = {};
  if (!input || typeof input !== 'object') return result;
  Object.entries(input as Record<string, any>).forEach(([feature, actions]) => {
    if (!actions || typeof actions !== 'object') return;
    const fKey = feature.toLowerCase();
    const actionEntries = Object.entries(actions as Record<string, any>)
      .filter(([, val]) => val === true)
      .map(([a]) => a.toLowerCase());
    if (actionEntries.length) {
      result[fKey] = {};
      actionEntries.forEach(a => { result[fKey][a] = true; });
    }
  });
  return result;
}

// Merge two permission maps (used if needed) keeping truthy actions
export function mergePermissions(base: NestedPermissions, extra: NestedPermissions): NestedPermissions {
  const merged: NestedPermissions = normalizePermissions(base);
  Object.entries(normalizePermissions(extra)).forEach(([feature, actions]) => {
    if (!merged[feature]) merged[feature] = {};
    Object.keys(actions).forEach(a => { merged[feature][a] = true; });
  });
  return merged;
}

// Produce a concise summary string
export function summarizePermissions(permissions: NestedPermissions | null | undefined): string {
  if (!permissions || typeof permissions !== 'object') return 'No permissions';
  try {
    const features = Object.keys(permissions);
    let actionCount = 0;
    features.forEach(f => { actionCount += Object.values(permissions[f]).filter(Boolean).length; });
    if (!features.length) return 'No permissions';
    return `${actionCount} actions across ${features.length} features`;
  } catch {
    return 'No permissions';
  }
}

// Event dispatcher helper after successful permission mutation
export function dispatchPermissionsUpdated(detail?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('permissionsUpdated', { detail }));
  }
}
