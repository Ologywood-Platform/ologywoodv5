import { ReactNode } from 'react';

/**
 * User roles
 */
export enum UserRole {
  ADMIN = 'admin',
  ARTIST = 'artist',
  VENUE = 'venue',
  USER = 'user',
}

/**
 * Route protection configuration
 */
export interface ProtectedRoute {
  path: string;
  requiredRoles: UserRole[];
  requiresAuth: boolean;
}

/**
 * Protected routes configuration
 */
export const PROTECTED_ROUTES: ProtectedRoute[] = [
  {
    path: '/admin/analytics',
    requiredRoles: [UserRole.ADMIN],
    requiresAuth: true,
  },
  {
    path: '/admin/users',
    requiredRoles: [UserRole.ADMIN],
    requiresAuth: true,
  },
  {
    path: '/admin/reports',
    requiredRoles: [UserRole.ADMIN],
    requiresAuth: true,
  },
  {
    path: '/dashboard',
    requiredRoles: [UserRole.ARTIST, UserRole.VENUE, UserRole.ADMIN],
    requiresAuth: true,
  },
  {
    path: '/bookings',
    requiredRoles: [UserRole.ARTIST, UserRole.VENUE, UserRole.ADMIN],
    requiresAuth: true,
  },
  {
    path: '/messages',
    requiredRoles: [UserRole.ARTIST, UserRole.VENUE, UserRole.ADMIN],
    requiresAuth: true,
  },
];

/**
 * Check if a user has access to a route
 */
export function hasRouteAccess(
  userRole: UserRole | null,
  isAuthenticated: boolean,
  path: string
): boolean {
  const route = PROTECTED_ROUTES.find((r) => r.path === path);

  // If route is not in protected list, allow access
  if (!route) {
    return true;
  }

  // Check authentication requirement
  if (route.requiresAuth && !isAuthenticated) {
    return false;
  }

  // Check role requirement
  if (userRole && route.requiredRoles.includes(userRole)) {
    return true;
  }

  return false;
}

/**
 * Get required roles for a route
 */
export function getRequiredRoles(path: string): UserRole[] {
  const route = PROTECTED_ROUTES.find((r) => r.path === path);
  return route?.requiredRoles || [];
}

/**
 * Check if route requires authentication
 */
export function requiresAuthentication(path: string): boolean {
  const route = PROTECTED_ROUTES.find((r) => r.path === path);
  return route?.requiresAuth || false;
}

/**
 * Check if route is admin-only
 */
export function isAdminRoute(path: string): boolean {
  const route = PROTECTED_ROUTES.find((r) => r.path === path);
  return route?.requiredRoles.includes(UserRole.ADMIN) || false;
}
