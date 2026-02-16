import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketApi } from '../api/tickets';
import { SlaChip } from '../components/SlaChip';
import { StatusBadge } from '../components/StatusBadge';
import { toFriendlyError } from '../lib/error';
import { Ticket } from '../types';

export const QueuePage = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<'unassigned' | 'mine'>('unassigned');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ticketApi.queue({
        page: 1,
        pageSize: 50,
        assigned: tab
      });
      setTickets(response.data);
    } catch (loadError) {
      setError(toFriendlyError(loadError, 'Unable to load queue.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [tab]);

  return (
    <section className="panel rounded-2xl p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Queue</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === 'unassigned' ? 'bg-brand-700 text-white' : 'bg-white/70'
            }`}
            onClick={() => setTab('unassigned')}
          >
            Unassigned
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === 'mine' ? 'bg-brand-700 text-white' : 'bg-white/70'
            }`}
            onClick={() => setTab('mine')}
          >
            My Assigned
          </button>
          <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={loadQueue}>
            Refresh
          </button>
        </div>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td className="px-3 py-5 text-slate-500" colSpan={5}>
                  Loading queue...
                </td>
              </tr>
            )}
            {!loading && tickets.length === 0 && (
              <tr>
                <td className="px-3 py-5 text-slate-500" colSpan={5}>
                  No tickets in this tab.
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
