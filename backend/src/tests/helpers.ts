import request from 'supertest';
import { createApp } from '../app';
import { AppDataSource } from '../config/data-source';
import { UserRole } from '../constants/roles';
import { User } from '../entities/User';
import { hashPassword } from '../utils/password';

export const app = createApp();

export const DEFAULT_PASSWORD = 'Password#123';

export const createUser = async (
  email: string,
  role: UserRole,
  options?: { isLead?: boolean; name?: string; password?: string }
) => {
  const repo = AppDataSource.getRepository(User);
  const password = options?.password ?? DEFAULT_PASSWORD;

  const user = repo.create({
    email: email.toLowerCase(),
    name: options?.name ?? email.split('@')[0],
    role,
    isLead: Boolean(options?.isLead),
    passwordHash: await hashPassword(password)
  });

  return repo.save(user);
};

export const loginAs = async (email: string, password = DEFAULT_PASSWORD) => {
  const response = await request(app).post('/auth/login').send({ email, password });
  return response.body.data.token as string;
};

export const createTicketViaApi = async (
  token: string,
  payload?: { title?: string; description?: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }
) => {
  const response = await request(app)
    .post('/tickets')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: payload?.title ?? 'Printer issue',
      description: payload?.description ?? 'The office printer is not working',
      priority: payload?.priority ?? 'MEDIUM'
    });

  return response;
};
