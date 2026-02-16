import { TicketStatus, TICKET_TRANSITIONS } from '../constants/ticket';
import { UserRole } from '../constants/roles';
import { AppError } from '../errors/AppError';
import { Ticket } from '../entities/Ticket';

interface AuthUser {
  id: string;
  role: UserRole;
  isLead: boolean;
}

export const canViewTicket = (ticket: Ticket, user: AuthUser): boolean => {
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  if (user.role === UserRole.REQUESTER) {
    return ticket.createdByUserId === user.id;
  }

  return ticket.assignedToUserId === user.id || ticket.assignedToUserId === null;
};

export const canParticipateOnTicket = (ticket: Ticket, user: AuthUser): boolean => {
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  if (ticket.createdByUserId === user.id) {
    return true;
  }

  return ticket.assignedToUserId === user.id;
};

export const assertCanViewTicket = (ticket: Ticket, user: AuthUser): void => {
  if (!canViewTicket(ticket, user)) {
    throw new AppError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
  }
};

export const assertCanParticipateOnTicket = (ticket: Ticket, user: AuthUser): void => {
  if (!canParticipateOnTicket(ticket, user)) {
    throw new AppError(403, 'FORBIDDEN', 'You are not allowed to access this ticket content');
  }
};

export const assertCanModifyTicket = (ticket: Ticket, user: AuthUser): void => {
  if (user.role === UserRole.ADMIN) {
    return;
  }

  if (user.role === UserRole.REQUESTER && ticket.createdByUserId === user.id) {
    return;
  }

  if (user.role === UserRole.AGENT && ticket.assignedToUserId === user.id) {
    return;
  }

  throw new AppError(403, 'FORBIDDEN', 'You are not allowed to modify this ticket');
};

export const getAllowedTransitions = (currentStatus: TicketStatus, user: AuthUser): TicketStatus[] => {
  const fromFsm = TICKET_TRANSITIONS[currentStatus] ?? [];

  if (user.role === UserRole.ADMIN) {
    return fromFsm;
  }

  if (user.role === UserRole.AGENT) {
    return fromFsm.filter((status) => status !== TicketStatus.CLOSED);
  }

  if (
    currentStatus === TicketStatus.WAITING_ON_CUSTOMER &&
    fromFsm.includes(TicketStatus.IN_PROGRESS)
  ) {
    return [TicketStatus.IN_PROGRESS];
  }

  return [];
};

export const validateTransitionOrThrow = (
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
  user: AuthUser
): void => {
  const fromFsm = TICKET_TRANSITIONS[currentStatus] ?? [];
  if (!fromFsm.includes(nextStatus)) {
    throw new AppError(400, 'INVALID_STATUS_TRANSITION', `Cannot transition from ${currentStatus} to ${nextStatus}`);
  }

  const allowedForRole = getAllowedTransitions(currentStatus, user);
  if (!allowedForRole.includes(nextStatus)) {
    throw new AppError(403, 'STATUS_TRANSITION_FORBIDDEN', 'This status transition is not allowed for your role');
  }
};
