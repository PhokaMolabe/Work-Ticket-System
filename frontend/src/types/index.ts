export type UserRole = 'ADMIN' | 'AGENT' | 'REQUESTER';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type SlaRisk = 'SAFE' | 'AT_RISK' | 'BREACHED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isLead: boolean;
}

export interface Evidence {
  id: string;
  ticketId: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedByUserId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  body: string;
  createdAt: string;
  author: User | null;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdByUserId: string;
  assignedToUserId: string | null;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
  slaRemainingMinutes: number;
  slaRisk: SlaRisk;
  allowedTransitions: TicketStatus[];
  createdBy: User | null;
  assignedTo: User | null;
  evidence?: Evidence[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorShape {
  errorCode: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
}

export interface AuditLog {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorRole: UserRole | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}
