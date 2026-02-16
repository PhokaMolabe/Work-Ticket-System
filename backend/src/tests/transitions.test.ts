import request from 'supertest';
import { UserRole } from '../constants/roles';
import { app, createTicketViaApi, createUser, loginAs } from './helpers';

describe('Ticket status transitions', () => {
  it('rejects invalid finite-state transition', async () => {
    await createUser('admin@example.com', UserRole.ADMIN);
    await createUser('requester@example.com', UserRole.REQUESTER);

    const adminToken = await loginAs('admin@example.com');
    const requesterToken = await loginAs('requester@example.com');

    const created = await createTicketViaApi(requesterToken, { priority: 'LOW' });

    const response = await request(app)
      .patch(`/tickets/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CLOSED' });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_STATUS_TRANSITION');
  });

  it('prevents agent from closing a resolved ticket', async () => {
    await createUser('admin@example.com', UserRole.ADMIN);
    const agent = await createUser('agent@example.com', UserRole.AGENT);
    await createUser('requester@example.com', UserRole.REQUESTER);

    const adminToken = await loginAs('admin@example.com');
    const agentToken = await loginAs('agent@example.com');
    const requesterToken = await loginAs('requester@example.com');

    const created = await createTicketViaApi(requesterToken, { priority: 'HIGH' });

    const assignResponse = await request(app)
      .patch(`/tickets/${created.body.data.id}/assign`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ assignedToUserId: agent.id });

    expect(assignResponse.status).toBe(200);

    const setResolved = await request(app)
      .patch(`/tickets/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

    expect(setResolved.status).toBe(200);

    const closeByAgent = await request(app)
      .patch(`/tickets/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'CLOSED' });

    expect(closeByAgent.status).toBe(403);
    expect(closeByAgent.body.errorCode).toBe('STATUS_TRANSITION_FORBIDDEN');
  });
});
