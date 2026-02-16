import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../constants/roles';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  isLead: boolean;
}

export const signToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
};
