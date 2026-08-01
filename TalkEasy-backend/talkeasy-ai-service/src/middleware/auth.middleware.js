import { verifyToken, AppError } from 'shared';
import { env } from '../config/env.js';

export const requireAuth = (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }
  const payload = verifyToken(token, env.JWT_SECRET);
  
  if (!payload) {
    return next(new AppError('Invalid or expired token', 401));
  }

  req.user = payload;
  next();
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token, env.JWT_SECRET);
  if (payload) {
    req.user = payload;
  }
  next();
};
