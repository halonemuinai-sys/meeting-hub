import type { AuthUser } from '@/context/AuthContext';

// Mirrors backend/middleware/auth.js — keep both in sync.
export type Permission =
  | 'calendar.view'
  | 'booking.create'
  | 'facility.manage'
  | 'reports.view'
  | 'users.manage';

type Role = AuthUser['role'];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ['calendar.view', 'booking.create', 'facility.manage', 'reports.view', 'users.manage'],
  GA_ADMIN: ['calendar.view', 'booking.create', 'facility.manage', 'reports.view'],
  USER: ['calendar.view', 'booking.create']
};

const GUEST_PERMISSIONS: Permission[] = ['calendar.view'];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  GA_ADMIN: 'GA Facility Officer',
  USER: 'Employee'
};

export function can(user: AuthUser | null | undefined, permission: Permission): boolean {
  const granted = user ? ROLE_PERMISSIONS[user.role] || [] : GUEST_PERMISSIONS;
  return granted.includes(permission);
}
