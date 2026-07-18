import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }
  next();
};
