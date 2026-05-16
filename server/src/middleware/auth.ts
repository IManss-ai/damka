import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'damka-secret-change-in-prod';

export interface AuthRequest extends Request { userId?: string; }

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(token, SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
}
