import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketApi } from '../api/tickets';
import { SlaChip } from '../components/SlaChip';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { toFriendlyError } from '../lib/error';
import { Ticket, TicketPriority, TicketStatus } from '../types';

const priorityOptions: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const statusOptions: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'];

export const TicketsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueAt' | 'priority' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => user?.role === 'REQUESTER' || user?.role === 'ADMIN', [user?.role]);

  const loadTickets = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ticketApi.list({
        page,
        pageSize: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sortBy,
        sortOrder
      });

      setTickets(response.data);
      setTotalPages(response.pagination.totalPages || 1);
    } catch (loadError) {
      setError(toFriendlyError(loadError, 'Unable to load tickets.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [page, search, statusFilter, priorityFilter, sortBy, sortOrder]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const onCreateTicket = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError('');

    try {
      await ticketApi.create({ title, description, priority });
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setPage(1);
      await loadTickets();
    } catch (createError) {
      setError(toFriendlyError(createError, 'Unable to create ticket.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="panel rounded-2xl p-5 shadow-panel">
        <h2 className="mb-4 text-lg font-bold">Tickets</h2>

        <form onSubmit={onSearch} className="mb-4 grid gap-3 md:grid-cols-6">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title or description"
            className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">All Priorities</option>
            {priorityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'createdAt' | 'dueAt' | 'priority' | 'status')}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="createdAt">Sort: Created</option>
            <option value="dueAt">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
          </select>

          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">
            Apply
          </button>
        </form>

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            Order: {sortOrder}
          </button>
        </div>

        {error && <p className="mb-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">SLA</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-3 py-5 text-slate-500" colSpan={6}>
                    Loading tickets...
                  </td>
                </tr>
              )}
              {!loading && tickets.length === 0 && (
                <tr>
                  <td className="px-3 py-5 text-slate-500" colSpan={6}>
                    No tickets found.
                  </td>
                </tr>
              )}
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="cursor-pointer hover:bg-brand-50/70"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <td className="px-3 py-3 font-semibold text-brand-900">{ticket.title}</td>
                  <td className="px-3 py-3">{ticket.priority}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-3 py-3">
                    <SlaChip risk={ticket.slaRisk} />
                  </td>
                  <td className="px-3 py-3">{new Date(ticket.dueAt).toLocaleString()}</td>
                  <td className="px-3 py-3">{ticket.assignedTo?.name ?? 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
          >
            Previous
          </button>

          <span>
            Page {page} / {Math.max(totalPages, 1)}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>

      {canCreate && (
        <section className="panel rounded-2xl p-5 shadow-panel">
          <h3 className="mb-4 text-lg font-bold">Create Ticket</h3>
          <form onSubmit={onCreateTicket} className="grid gap-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ticket title"
              className="rounded-lg border border-slate-300 px-3 py-2"
              required
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detailed description"
              rows={4}
              className="rounded-lg border border-slate-300 px-3 py-2"
              required
            />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TicketPriority)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {priorityOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating}
              className="w-fit rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Ticket'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
