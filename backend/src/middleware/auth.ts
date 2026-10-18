import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { recordSecurityEvent } from '../services/securityService';

const JWT_SECRET = process.env.JWT_SECRET || 'agribiotech_super_secret_jwt_key_2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agronomist' | 'biotech_expert' | 'farmer' | 'ADMIN' | 'AGRONOMIST' | 'BIOTECH_EXPERT' | 'FARMER';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
    return;
  }
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch {
      // ignore optional auth errors
    }
  }
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Please authenticate' });
      return;
    }

    const normalizedUserRole = req.user.role.toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (normalizedAllowed.includes(normalizedUserRole)) {
      next();
      return;
    }

    const attemptedResource = req.originalUrl || req.baseUrl + req.path || req.path;
    const targetRole = allowedRoles.join(', ');

    // Asynchronously log the security denial event and alert admins/account owner
    recordSecurityEvent({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      attemptedResource,
      targetRole,
      requestedRoute: req.originalUrl || req.path,
      outcome: 'denied',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: `User ${req.user.name} (${req.user.role}) denied access to ${attemptedResource}. Required roles: [${allowedRoles.join(', ')}]`,
    }).catch(err => {
      console.error('Error logging security event in requireRole:', err);
    });

    res.status(403).json({
      error: `Forbidden: Requires one of [${allowedRoles.join(', ')}], current role: ${req.user.role}`
    });
  };
};
