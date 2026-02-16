import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../constants/roles';
import { AppError } from '../errors/AppError';

export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'AUTH_REQUIRED', 'Authentication is required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You are not allowed to perform this action'));
    }

    return next();
  };
};
