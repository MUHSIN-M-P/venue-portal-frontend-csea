import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const ROLE_OPTIONS = [
  'CLUB',
  'FACULTY_COORDINATOR',
  'STAFF_IN_CHARGE',
  'FACULTY_IN_CHARGE',
  'HOD',
  'ADMIN',
] as const;

export type PortalRole = (typeof ROLE_OPTIONS)[number];

export type RoleAssignment = {
  role: PortalRole;
};

export function formatRoleLabel(role: string) {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function hasRole(roles: readonly PortalRole[] | undefined, role: PortalRole) {
  return roles?.includes(role) ?? false;
}

export function extractRoleValues(roleAssignments: readonly RoleAssignment[] | undefined) {
  return roleAssignments?.map((assignment) => assignment.role) ?? [];
}

export function getStoredRoles() {
  if (typeof window === 'undefined') {
    return [] as PortalRole[];
  }

  const storedRoles = localStorage.getItem('perms_user_roles');
  if (storedRoles) {
    try {
      const parsed = JSON.parse(storedRoles);
      if (Array.isArray(parsed)) {
        return parsed.filter((role): role is PortalRole => typeof role === 'string' && ROLE_OPTIONS.includes(role as PortalRole));
      }
    } catch {
      return [] as PortalRole[];
    }
  }

  return [] as PortalRole[];
}

export function setStoredRoles(roles: readonly PortalRole[]) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('perms_user_roles', JSON.stringify(roles));
}

export function getPrimaryRouteForRoles(roles: readonly PortalRole[]) {
  const routeMap: Record<PortalRole, string> = {
    ADMIN: '/admin',
    CLUB: '/club',
    FACULTY_COORDINATOR: '/faculty_coordinator',
    STAFF_IN_CHARGE: '/staff_in_charge',
    FACULTY_IN_CHARGE: '/faculty_in_charge',
    HOD: '/hod',
  };

  const routePriority: PortalRole[] = [
    'ADMIN',
    'FACULTY_COORDINATOR',
    'STAFF_IN_CHARGE',
    'FACULTY_IN_CHARGE',
    'HOD',
    'CLUB',
  ];

  const primaryRole = routePriority.find((role) => roles.includes(role));
  return primaryRole ? routeMap[primaryRole] : '/login';
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
