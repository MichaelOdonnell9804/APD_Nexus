export const ORG_ROLES = ['director', 'staff', 'grad', 'undergrad', 'external'] as const;
export const PROJECT_ROLES = ['owner', 'maintainer', 'member', 'viewer'] as const;

export function isStaffOrDirector(role?: string | null) {
  return role === 'director' || role === 'staff';
}

export function isDirector(role?: string | null) {
  return role === 'director';
}
