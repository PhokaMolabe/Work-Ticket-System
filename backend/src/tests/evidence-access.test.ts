import request from 'supertest';
import { UserRole } from '../constants/roles';
import { app, createTicketViaApi, createUser, loginAs } from './helpers';

describe('Evidence access control', () => {
  it('rejects non-participants from listing and downloading evidence', async () => {
    await createUser('requester-owner@example.com', UserRole.REQUESTER);
    await createUser('requester-other@example.com', UserRole.REQUESTER);

    const ownerToken = await loginAs('requester-owner@example.com');
    const otherToken = await loginAs('requester-other@example.com');

    const ticket = await createTicketViaApi(ownerToken, {
      title: 'VPN issue',
      description: 'Cannot connect to VPN',
      priority: 'HIGH'
    });

    const upload = await request(app)
      .post(`/tickets/${ticket.body.data.id}/evidence`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from('evidence-content'), 'evidence.txt');

    expect(upload.status).toBe(201);

    const listEvidence = await request(app)
      .get(`/tickets/${ticket.body.data.id}/evidence`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(listEvidence.status).toBe(403);
    expect(listEvidence.body.errorCode).toBe('FORBIDDEN');

    const download = await request(app)
      .get(`/evidence/${upload.body.data.id}/download`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(download.status).toBe(403);
    expect(download.body.errorCode).toBe('FORBIDDEN');
  });
});
