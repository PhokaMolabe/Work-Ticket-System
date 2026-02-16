import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../errors/AppError';

export const validate = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const target = req[source];
    const parsed = schema.safeParse(target);

    if (!parsed.success) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', parsed.error.flatten())
      );
    }

    (req as Request)[source] = parsed.data as never;
    return next();
  };
};
