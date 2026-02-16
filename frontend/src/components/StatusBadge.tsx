import { TicketStatus } from '../types';

const statusClass: Record<TicketStatus, string> = {
  OPEN: 'bg-sky-100 text-sky-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  WAITING_ON_CUSTOMER: 'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-slate-200 text-slate-700'
};

export const StatusBadge = ({ status }: { status: TicketStatus }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[status]}`}>{status}</span>
);
