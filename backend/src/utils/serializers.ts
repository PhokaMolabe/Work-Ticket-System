import { Ticket } from '../entities/Ticket';
import { User } from '../entities/User';
import { Evidence } from '../entities/Evidence';
import { Comment } from '../entities/Comment';
import { computeSla } from './sla';
import { getAllowedTransitions } from '../services/ticket.service';
import { UserRole } from '../constants/roles';

interface AuthUser {
  id: string;
  role: UserRole;
  isLead: boolean;
}

export const serializeUser = (user: User | null | undefined) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isLead: user.isLead
  };
};

export const serializeEvidence = (evidence: Evidence) => ({
  id: evidence.id,
  ticketId: evidence.ticketId,
  filename: evidence.filename,
  mimeType: evidence.mimeType,
  size: evidence.size,
  uploadedByUserId: evidence.uploadedByUserId,
  createdAt: evidence.createdAt
});

export const serializeComment = (comment: Comment) => ({
  id: comment.id,
  ticketId: comment.ticketId,
  userId: comment.userId,
  body: comment.body,
  createdAt: comment.createdAt,
  author: serializeUser(comment.author)
});

export const serializeTicket = (ticket: Ticket, user: AuthUser) => {
  const sla = computeSla(ticket.createdAt, ticket.dueAt);
  const allowedTransitions = getAllowedTransitions(ticket.status, user);

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    createdByUserId: ticket.createdByUserId,
    assignedToUserId: ticket.assignedToUserId,
    dueAt: ticket.dueAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    slaRemainingMinutes: sla.slaRemainingMinutes,
    slaRisk: sla.slaRisk,
    allowedTransitions,
    createdBy: serializeUser(ticket.createdBy),
    assignedTo: serializeUser(ticket.assignedTo)
  };
};
