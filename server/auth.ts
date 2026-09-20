import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'lesa-nour-secret-key-2026-safe';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'USER';
  avatar?: string;
  bio?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authenticateOptional(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = queryOne<AuthUser>(
      'SELECT id, email, name, role, avatar, bio FROM users WHERE id = ?',
      [decoded.id]
    );
    if (user) {
      if (user.email.toLowerCase() === 'fatmamohamed36699@gmail.com') {
        user.role = 'ADMIN';
      }
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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = queryOne<AuthUser>(
      'SELECT id, email, name, role, avatar, bio FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!user) {
      return res.status(401).json({ error: 'المستخدم غير موجود' });
    }
    if (user.email.toLowerCase() === 'fatmamohamed36699@gmail.com') {
      user.role = 'ADMIN';
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' });
  }
}

export function requireEditor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role === 'ADMIN' || req.user?.role === 'EDITOR') {
      return next();
    }
    return res.status(403).json({ error: 'ليس لديك صلاحيات التحرير' });
  });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role === 'ADMIN') {
      return next();
    }
    return res.status(403).json({ error: 'هذه العملية تتطلب صلاحيات المدير العام' });
  });
}
