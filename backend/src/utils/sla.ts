import { TicketPriority, SlaRisk } from '../constants/ticket';

const SLA_MINUTES: Record<TicketPriority, number> = {
  [TicketPriority.LOW]: 5 * 24 * 60,
  [TicketPriority.MEDIUM]: 3 * 24 * 60,
  [TicketPriority.HIGH]: 24 * 60,
  [TicketPriority.URGENT]: 4 * 60
};

export const computeDueAt = (priority: TicketPriority, startDate: Date = new Date()): Date => {
  return new Date(startDate.getTime() + SLA_MINUTES[priority] * 60000);
};

const asDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

export const computeSla = (createdAt: Date | string, dueAt: Date | string, nowDate: Date = new Date()) => {
  const created = asDate(createdAt);
  const due = asDate(dueAt);

  const totalWindowMinutes = Math.max(1, Math.floor((due.getTime() - created.getTime()) / 60000));
  const slaRemainingMinutes = Math.floor((due.getTime() - nowDate.getTime()) / 60000);

  let slaRisk: SlaRisk = SlaRisk.SAFE;
  if (slaRemainingMinutes < 0) {
    slaRisk = SlaRisk.BREACHED;
  } else {
    const ratio = slaRemainingMinutes / totalWindowMinutes;
    if (ratio < 0.2) {
      slaRisk = SlaRisk.AT_RISK;
    }
  }

  return {
    slaRemainingMinutes,
    slaRisk
  };
};
