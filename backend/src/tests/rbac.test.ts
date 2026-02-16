import request from 'supertest';
import { UserRole } from '../constants/roles';
import { app, createTicketViaApi, createUser, loginAs } from './helpers';

describe('RBAC', () => {
  it('rejects requester access to admin audit logs endpoint', async () => {
    await createUser('requester@example.com', UserRole.REQUESTER);
    const token = await loginAs('requester@example.com');

    const response = await request(app)
      .get('/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.errorCode).toBe('FORBIDDEN');
  });

  it('prevents requester from reading another requester ticket', async () => {
    await createUser('requester1@example.com', UserRole.REQUESTER);
    await createUser('requester2@example.com', UserRole.REQUESTER);

    const token1 = await loginAs('requester1@example.com');
    const token2 = await loginAs('requester2@example.com');

    const ticketResponse = await createTicketViaApi(token1, {
      title: 'Email issue',
      description: 'Cannot access mailbox',
      priority: 'HIGH'
    });

    const response = await request(app)
      .get(`/tickets/${ticketResponse.body.data.id}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(response.status).toBe(404);
    expect(response.body.errorCode).toBe('TICKET_NOT_FOUND');
  });
});
