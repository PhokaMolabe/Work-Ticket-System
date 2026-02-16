import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { verifyToken } from '../utils/jwt';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError(401, 'AUTH_REQUIRED', 'Authentication is required'));
  }

  try {
    const decoded = verifyToken(token);
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: decoded.sub } });

    if (!user) {
      return next(new AppError(401, 'AUTH_INVALID', 'Invalid authentication token'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isLead: user.isLead
    };

    return next();
  } catch {
    return next(new AppError(401, 'AUTH_INVALID', 'Invalid or expired authentication token'));
  }
};
