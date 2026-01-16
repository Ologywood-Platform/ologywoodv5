import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { hasRouteAccess, UserRole } from '../middleware/routeProtection';
import { useToastContext } from './ErrorToast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiresAuth?: boolean;
}

interface UserContext {
  user: {
    id: number;
    role: UserRole;
    name: string;
    email: string;
  } | null;
  isAuthenticated: boolean;
}

/**
 * Protected Route Component
 * Restricts access to routes based on user role and authentication status
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiresAuth = true,
}) => {
  const location = useLocation();
  const { addError } = useToastContext();

  // Get user from context or localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!user;
  const userRole = user?.role as UserRole | null;

  // Check if user has access
  const hasAccess = hasRouteAccess(userRole, isAuthenticated, location.pathname);

  if (!hasAccess) {
    // Show error toast
    if (!isAuthenticated) {
      addError(
        'Authentication Required',
        'Please log in to access this page',
        {
          label: 'Go to Login',
          onClick: () => {
            window.location.href = '/login';
          },
        }
      );
    } else {
      addError(
        'Access Denied',
        `You do not have permission to access this page. Required roles: ${requiredRoles.join(', ')}`,
        {
          label: 'Go Back',
          onClick: () => {
            window.history.back();
          },
        }
      );
    }

    // Redirect to login or dashboard
    return (
      <Navigate
        to={isAuthenticated ? '/dashboard' : '/login'}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
};

/**
 * Admin Route Component
 * Restricts access to admin-only routes
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]} requiresAuth={true}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Authenticated Route Component
 * Requires user to be logged in
 */
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ProtectedRoute requiresAuth={true}>{children}</ProtectedRoute>;
};

/**
 * Access Denied Component
 * Displays when user doesn't have access to a route
 */
export const AccessDenied: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;
