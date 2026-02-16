import { FormEvent, useEffect, useState } from 'react';
import { adminApi } from '../api/admin';
import { toFriendlyError } from '../lib/error';
import { AuditLog } from '../types';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [actorUserId, setActorUserId] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const query = {
    page,
    pageSize: 20,
    actorUserId: actorUserId || undefined,
    action: action || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.listAuditLogs(query);
      setLogs(response.data);
      setTotalPages(response.pagination.totalPages || 1);
    } catch (loadError) {
      setError(toFriendlyError(loadError, 'Unable to load audit logs.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    load();
  };

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const file = await adminApi.exportAuditLogs(format, query);
      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(toFriendlyError(exportError, 'Unable to export logs.'));
    }
  };

  return (
    <section className="panel rounded-2xl p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Audit Logs</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => exportLogs('csv')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            Export CSV
          </button>
          <button type="button" onClick={() => exportLogs('json')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            Export JSON
          </button>
        </div>
      </div>

      <form onSubmit={applyFilters} className="mb-4 grid gap-3 md:grid-cols-5">
        <input
          value={actorUserId}
          onChange={(event) => setActorUserId(event.target.value)}
          placeholder="Actor User ID"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="Action"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
          Apply
        </button>
      </form>

      {error && <p className="mb-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="px-3 py-2">Created At</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td className="px-3 py-5 text-slate-500" colSpan={5}>
                  Loading logs...
                </td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td className="px-3 py-5 text-slate-500" colSpan={5}>
                  No logs found.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-3 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-3 py-3">{log.actorUserId ?? 'N/A'}</td>
                <td className="px-3 py-3">{log.action}</td>
                <td className="px-3 py-3">
                  {log.resourceType} / {log.resourceId ?? 'N/A'}
                </td>
                <td className="max-w-lg truncate px-3 py-3">{JSON.stringify(log.metadata ?? {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page {page} / {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
          className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
};
