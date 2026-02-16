import { TicketPriority, SlaRisk } from '../constants/ticket';
import { computeDueAt, computeSla } from '../utils/sla';

describe('SLA logic', () => {
  it('computes dueAt offsets by priority and risk classification', () => {
    const now = new Date('2026-01-10T10:00:00.000Z');

    const highDueAt = computeDueAt(TicketPriority.HIGH, now);
    expect(highDueAt.toISOString()).toBe('2026-01-11T10:00:00.000Z');

    const safe = computeSla(now, new Date('2026-01-10T20:00:00.000Z'), new Date('2026-01-10T12:00:00.000Z'));
    const atRisk = computeSla(now, new Date('2026-01-10T20:00:00.000Z'), new Date('2026-01-10T18:30:00.000Z'));
    const breached = computeSla(now, new Date('2026-01-10T20:00:00.000Z'), new Date('2026-01-10T20:10:00.000Z'));

    expect(safe.slaRisk).toBe(SlaRisk.SAFE);
    expect(atRisk.slaRisk).toBe(SlaRisk.AT_RISK);
    expect(breached.slaRisk).toBe(SlaRisk.BREACHED);
  });
});
