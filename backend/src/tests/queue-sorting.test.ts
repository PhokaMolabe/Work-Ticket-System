import request from 'supertest';
import { AppDataSource } from '../config/data-source';
import { UserRole } from '../constants/roles';
import { TicketPriority, TicketStatus } from '../constants/ticket';
import { Ticket } from '../entities/Ticket';
import { app, createUser, loginAs } from './helpers';

describe('Queue sorting', () => {
  it('sorts urgent first, then nearest SLA breach, then newest', async () => {
    const requester = await createUser('requester@example.com', UserRole.REQUESTER);
    await createUser('agent@example.com', UserRole.AGENT);
    const agentToken = await loginAs('agent@example.com');

    const ticketRepo = AppDataSource.getRepository(Ticket);
    const base = new Date('2026-02-01T00:00:00.000Z');

    const t1 = await ticketRepo.save(
      ticketRepo.create({
        title: 'Urgent older',
        description: 'Urgent ticket older',
        priority: TicketPriority.URGENT,
        status: TicketStatus.OPEN,
        createdByUserId: requester.id,
        assignedToUserId: null,
        dueAt: new Date('2026-02-01T10:00:00.000Z')
      })
    );

    const t2 = await ticketRepo.save(
      ticketRepo.create({
        title: 'Urgent newer',
        description: 'Urgent ticket newer',
        priority: TicketPriority.URGENT,
        status: TicketStatus.OPEN,
        createdByUserId: requester.id,
        assignedToUserId: null,
        dueAt: new Date('2026-02-01T10:00:00.000Z')
      })
    );

    const t3 = await ticketRepo.save(
      ticketRepo.create({
        title: 'High priority',
        description: 'High ticket',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        createdByUserId: requester.id,
        assignedToUserId: null,
        dueAt: new Date('2026-02-01T08:00:00.000Z')
      })
    );

    await ticketRepo.update(t1.id, { createdAt: new Date('2026-02-01T01:00:00.000Z') });
    await ticketRepo.update(t2.id, { createdAt: new Date('2026-02-01T02:00:00.000Z') });
    await ticketRepo.update(t3.id, { createdAt: base });

    const response = await request(app)
      .get('/tickets/queue')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].id).toBe(t2.id);
    expect(response.body.data[1].id).toBe(t1.id);
    expect(response.body.data[2].id).toBe(t3.id);
  });
});
