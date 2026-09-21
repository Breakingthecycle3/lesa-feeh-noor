import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne, queryAll, execute } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'lesa-nour-secret-key-2026-safe';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'USER';
  role_id?: number;
  permissions?: string[];
  avatar?: string;
  bio?: string;
  two_factor_enabled?: number;
  sessionId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function getUserPermissions(userId: number, roleId?: number): string[] {
  if (!roleId) return [];
  
  const perms = queryAll<{ name: string }>(`
    SELECT p.name 
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `, [roleId]);
  
  return perms.map((p: { name: string }) => p.name);
}

export function signToken(user: AuthUser & { sessionId?: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, role_id: user.role_id, sessionId: user.sessionId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function authenticateOptional(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role_id?: number; sessionId?: string };
    
    // Check session validity if sessionId is present
    if (decoded.sessionId) {
      const session = queryOne('SELECT id FROM user_sessions WHERE id = ? AND user_id = ?', [decoded.sessionId, decoded.id]);
      if (!session) {
        return next(); // Session invalidated, continue as guest
      }
    }

    const user = queryOne<AuthUser>(
      'SELECT id, email, name, role, role_id, avatar, bio, two_factor_enabled FROM users WHERE id = ?',
      [decoded.id]
    );
    if (user) {
      if (user.role_id) {
        user.permissions = getUserPermissions(user.id, user.role_id);
      }
      user.sessionId = decoded.sessionId;
      req.user = user;
    }
  } catch (err) {
    // Token invalid or expired, continue without user
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role_id?: number; sessionId?: string };
    
    // Check session validity if sessionId is present
    if (decoded.sessionId) {
      const session = queryOne('SELECT id FROM user_sessions WHERE id = ? AND user_id = ?', [decoded.sessionId, decoded.id]);
      if (!session) {
        return res.status(401).json({ error: 'انتهت صلاحية الجلسة أو تم تسجيل الدخول من جهاز آخر' });
      }
    }

    const user = queryOne<AuthUser>(
      'SELECT id, email, name, role, role_id, avatar, bio, two_factor_enabled FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!user) {
      return res.status(401).json({ error: 'المستخدم غير موجود' });
    }
    
    if (user.role_id) {
      user.permissions = getUserPermissions(user.id, user.role_id);
    }
    
    user.sessionId = decoded.sessionId;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' });
  }
}

export function hasPermission(req: AuthenticatedRequest, permission: string): boolean {
  if (!req.user) return false;
  if (req.user.role === 'SUPER_ADMIN') return true;
  return req.user.permissions?.includes(permission) || false;
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (hasPermission(req, permission)) {
        return next();
      }
      return res.status(403).json({ error: `ليس لديك صلاحية الوصول لهذه العملية (${permission})` });
    });
  };
}

export function requireEditor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN' || req.user?.role === 'EDITOR' || hasPermission(req, 'content.view')) {
      return next();
    }
    return res.status(403).json({ error: 'ليس لديك صلاحيات التحرير' });
  });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN') {
      return next();
    }
    return res.status(403).json({ error: 'هذه العملية تتطلب صلاحيات المدير العام' });
  });
}

export function logAudit(user: AuthUser | undefined, action: string, resourceType: string, resourceId?: string, details?: any, status: 'success' | 'failure' = 'success') {
  try {
    execute(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      user?.id || null,
      user?.name || 'Anonymous',
      action,
      resourceType,
      resourceId || null,
      details ? JSON.stringify(details) : null,
      status
    ]);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
