import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketApi } from '../api/tickets';
import { SlaChip } from '../components/SlaChip';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { toFriendlyError } from '../lib/error';
import { Comment, Evidence, Ticket } from '../types';

export const TicketDetailPage = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [statusTarget, setStatusTarget] = useState('');
  const [assigneeInput, setAssigneeInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const loadAll = async () => {
    if (!ticketId) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [ticketResponse, commentResponse, evidenceResponse] = await Promise.all([
        ticketApi.getById(ticketId),
        ticketApi.listComments(ticketId),
        ticketApi.listEvidence(ticketId)
      ]);

      setTicket(ticketResponse);
      setComments(commentResponse);
      setEvidence(evidenceResponse);
      setStatusTarget(ticketResponse.allowedTransitions[0] ?? '');
      setAssigneeInput(ticketResponse.assignedToUserId ?? '');
    } catch (loadError) {
      setError(toFriendlyError(loadError, 'Unable to load ticket details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [ticketId]);

  const canSelfAssign = useMemo(() => {
    return user?.role === 'AGENT' && !user.isLead && ticket?.assignedToUserId === null;
  }, [user, ticket]);

  const canManualAssign = useMemo(() => {
    if (!user) {
      return false;
    }

    return user.role === 'ADMIN' || (user.role === 'AGENT' && user.isLead);
  }, [user]);

  const updateStatus = async (event: FormEvent) => {
    event.preventDefault();
    if (!ticket || !statusTarget) {
      return;
    }

    setActionError('');
    try {
      await ticketApi.updateStatus(ticket.id, statusTarget);
      await loadAll();
    } catch (statusError) {
      setActionError(toFriendlyError(statusError, 'Unable to update status.'));
    }
  };

  const assignToMe = async () => {
    if (!ticket || !user) {
      return;
    }

    setActionError('');
    try {
      await ticketApi.assign(ticket.id, user.id);
      await loadAll();
    } catch (assignError) {
      setActionError(toFriendlyError(assignError, 'Unable to assign ticket.'));
    }
  };

  const assignManual = async (event: FormEvent) => {
    event.preventDefault();
    if (!ticket) {
      return;
    }

    setActionError('');
    try {
      await ticketApi.assign(ticket.id, assigneeInput.trim() || null);
      await loadAll();
    } catch (assignError) {
      setActionError(toFriendlyError(assignError, 'Unable to update assignment.'));
    }
  };

  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!ticket || !commentInput.trim()) {
      return;
    }

    setActionError('');
    try {
      await ticketApi.addComment(ticket.id, commentInput.trim());
      setCommentInput('');
      const updated = await ticketApi.listComments(ticket.id);
      setComments(updated);
    } catch (commentError) {
      setActionError(toFriendlyError(commentError, 'Unable to add comment.'));
    }
  };

  const uploadEvidence = async (event: FormEvent) => {
    event.preventDefault();
    if (!ticket || !uploadFile) {
      return;
    }

    setActionError('');
    try {
      await ticketApi.uploadEvidence(ticket.id, uploadFile);
      setUploadFile(null);
      const updated = await ticketApi.listEvidence(ticket.id);
      setEvidence(updated);
    } catch (uploadError) {
      setActionError(toFriendlyError(uploadError, 'Unable to upload evidence.'));
    }
  };

  const downloadEvidence = async (item: Evidence) => {
    try {
      const blob = await ticketApi.downloadEvidence(item.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setActionError(toFriendlyError(downloadError, 'Unable to download evidence.'));
    }
  };

  if (loading) {
    return <div className="panel rounded-2xl p-5 shadow-panel">Loading ticket...</div>;
  }

  if (error || !ticket) {
    return <div className="panel rounded-2xl p-5 text-rose-700 shadow-panel">{error || 'Ticket not found'}</div>;
  }

  return (
    <div className="space-y-4">
      <section className="panel rounded-2xl p-5 shadow-panel">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-900">{ticket.title}</h2>
            <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
          </div>

          <div className="space-y-2 text-right text-sm">
            <div>
              <StatusBadge status={ticket.status} />
            </div>
            <div>
              <SlaChip risk={ticket.slaRisk} />
            </div>
            <p className="text-slate-600">SLA minutes remaining: {ticket.slaRemainingMinutes}</p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p>
            <span className="font-semibold">Priority:</span> {ticket.priority}
          </p>
          <p>
            <span className="font-semibold">Due:</span> {new Date(ticket.dueAt).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Created By:</span> {ticket.createdBy?.name ?? ticket.createdByUserId}
          </p>
          <p>
            <span className="font-semibold">Assigned To:</span> {ticket.assignedTo?.name ?? 'Unassigned'}
          </p>
        </div>

        {actionError && <p className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{actionError}</p>}
      </section>

      <section className="panel rounded-2xl p-5 shadow-panel">
        <h3 className="mb-3 text-lg font-bold">Status & Assignment</h3>

        <form onSubmit={updateStatus} className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold text-slate-700">
            Next Status
            <select
              value={statusTarget}
              onChange={(event) => setStatusTarget(event.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
              disabled={ticket.allowedTransitions.length === 0}
            >
              {ticket.allowedTransitions.length === 0 && <option value="">No allowed transitions</option>}
              {ticket.allowedTransitions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={!statusTarget}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Update Status
          </button>
        </form>

        {canSelfAssign && (
          <button
            type="button"
            onClick={assignToMe}
            className="mb-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Assign to Me
          </button>
        )}

        {canManualAssign && (
          <form onSubmit={assignManual} className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Assignee User ID
              <input
                value={assigneeInput}
                onChange={(event) => setAssigneeInput(event.target.value)}
                placeholder="UUID or empty to unassign"
                className="mt-1 block w-72 rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <button type="submit" className="rounded-lg border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700">
              Save Assignment
            </button>
          </form>
        )}
      </section>

      <section className="panel rounded-2xl p-5 shadow-panel">
        <h3 className="mb-3 text-lg font-bold">Comments</h3>

        <form onSubmit={addComment} className="mb-4 flex flex-col gap-2">
          <textarea
            value={commentInput}
            onChange={(event) => setCommentInput(event.target.value)}
            rows={3}
            placeholder="Add comment"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <button type="submit" className="w-fit rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Add Comment
          </button>
        </form>

        <div className="space-y-3">
          {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-lg border border-slate-200 bg-white/70 p-3">
              <p className="mb-2 text-sm text-slate-800">{comment.body}</p>
              <p className="text-xs text-slate-500">
                {comment.author?.name ?? comment.userId} • {new Date(comment.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel rounded-2xl p-5 shadow-panel">
        <h3 className="mb-3 text-lg font-bold">Evidence</h3>

        <form onSubmit={uploadEvidence} className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold text-slate-700">
            Upload File
            <input
              type="file"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              className="mt-1 block text-sm"
            />
          </label>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Upload
          </button>
        </form>

        <div className="space-y-2">
          {evidence.length === 0 && <p className="text-sm text-slate-500">No evidence files yet.</p>}
          {evidence.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2">
              <div className="text-sm text-slate-700">
                <p className="font-semibold">{item.filename}</p>
                <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => downloadEvidence(item)}
                className="rounded-lg border border-brand-700 px-3 py-1 text-sm font-semibold text-brand-700"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
