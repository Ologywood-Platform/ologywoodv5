import { Request, Response, NextFunction } from 'express';
import { User } from '../db';

/**
 * Role-Based Access Control Middleware
 * Enforces permissions based on user role
 */

export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

/**
 * Middleware to check if user is an artist
 */
export const requireArtist = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'artist') {
    return res.status(403).json({ error: 'This action requires an artist account' });
  }

  next();
};

/**
 * Middleware to check if user is a venue
 */
export const requireVenue = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'venue') {
    return res.status(403).json({ error: 'This action requires a venue account' });
  }

  next();
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'This action requires admin privileges' });
  }

  next();
};

/**
 * Middleware to check if user owns a resource
 */
export const requireOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  getOwnerId: (req: AuthRequest) => Promise<number | null>
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const ownerId = await getOwnerId(req);

    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Permission matrix for different roles
 */
export const permissions = {
  user: {
    browse_artists: true,
    browse_venues: true,
    create_booking: true,
    view_own_bookings: true,
    message: true,
    leave_review: true,
  },
  artist: {
    browse_venues: true,
    edit_profile: true,
    upload_rider: true,
    manage_availability: true,
    view_bookings: true,
    accept_booking: true,
    decline_booking: true,
    message: true,
    respond_to_review: true,
  },
  venue: {
    browse_artists: true,
    edit_profile: true,
    create_booking: true,
    manage_bookings: true,
    message: true,
    leave_review: true,
  },
  admin: {
    browse_artists: true,
    browse_venues: true,
    browse_users: true,
    manage_users: true,
    manage_artists: true,
    manage_venues: true,
    manage_bookings: true,
    view_analytics: true,
    manage_system: true,
    view_all_messages: true,
    manage_disputes: true,
  },
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (role: string, permission: string): boolean => {
  const rolePermissions = permissions[role as keyof typeof permissions];
  return rolePermissions ? rolePermissions[permission as keyof typeof rolePermissions] === true : false;
};

/**
 * Middleware to check specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: `Forbidden: Permission '${permission}' required` });
    }

    next();
  };
};
