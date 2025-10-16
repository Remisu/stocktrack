import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server misconfigured (JWT_SECRET)' });

    const payload = jwt.verify(token, secret) as { sub?: string };
    (req as any).userId = payload?.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}