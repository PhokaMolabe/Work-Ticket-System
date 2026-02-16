export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_ON_CUSTOMER = 'WAITING_ON_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum SlaRisk {
  SAFE = 'SAFE',
  AT_RISK = 'AT_RISK',
  BREACHED = 'BREACHED'
}

export const TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.RESOLVED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.RESOLVED],
  [TicketStatus.WAITING_ON_CUSTOMER]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  [TicketStatus.RESOLVED]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: []
};

export const PRIORITY_ORDER: Record<TicketPriority, number> = {
  [TicketPriority.URGENT]: 1,
  [TicketPriority.HIGH]: 2,
  [TicketPriority.MEDIUM]: 3,
  [TicketPriority.LOW]: 4
};
