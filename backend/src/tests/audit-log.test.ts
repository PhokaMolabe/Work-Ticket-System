import request from 'supertest';
import { AppDataSource } from '../config/data-source';
import { AUDIT_ACTIONS } from '../constants/audit';
import { UserRole } from '../constants/roles';
import { AuditLog } from '../entities/AuditLog';
import { app, createTicketViaApi, createUser, loginAs } from './helpers';

describe('Audit logs', () => {
  it('creates audit logs for login success, login failure, and ticket creation', async () => {
    await createUser('requester@example.com', UserRole.REQUESTER);

    const token = await loginAs('requester@example.com');

    const badLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'requester@example.com', password: 'wrong-password' });
    expect(badLogin.status).toBe(401);

    const createTicket = await createTicketViaApi(token, {
      title: 'Need laptop',
      description: 'Laptop replacement request',
      priority: 'MEDIUM'
    });
    expect(createTicket.status).toBe(201);

    const logs = await AppDataSource.getRepository(AuditLog).find();
    const actions = logs.map((log) => log.action);

    expect(actions).toContain(AUDIT_ACTIONS.LOGIN_SUCCESS);
    expect(actions).toContain(AUDIT_ACTIONS.LOGIN_FAILURE);
    expect(actions).toContain(AUDIT_ACTIONS.TICKET_CREATED);
  });
});
