import bcrypt from 'bcryptjs';

export const hashPassword = async (rawPassword: string): Promise<string> => {
  return bcrypt.hash(rawPassword, 12);
};

export const verifyPassword = async (rawPassword: string, passwordHash: string): Promise<boolean> => {
  return bcrypt.compare(rawPassword, passwordHash);
};
