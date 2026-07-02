import React from 'react';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, XCircle } from 'lucide-react';

export default function JobTable({ jobs = [], onRetry, onCancel }) {
  if (!jobs.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-dark-border">
      <table className="table-container">
        <thead className="table-header">
          <tr>
            <th className="table-cell">Job ID</th>
            <th className="table-cell">Queue</th>
            <th className="table-cell">Status</th>
            <th className="table-cell">Priority</th>
            <th className="table-cell">Attempts</th>
            <th className="table-cell">Worker</th>
            <th className="table-cell">Created</th>
            <th className="table-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="table-row group">
              <td className="table-cell font-mono text-accent text-xs">#{job.id}</td>
              <td className="table-cell text-text-primary">{job.queue_name || `Queue #${job.queue_id}`}</td>
              <td className="table-cell"><StatusBadge status={job.status} /></td>
              <td className="table-cell">
                <span className="text-text-secondary capitalize">{job.priority || 'normal'}</span>
              </td>
              <td className="table-cell text-text-secondary">
                {job.retry_count}/{job.max_retries}
              </td>
              <td className="table-cell text-text-secondary font-mono text-xs">
                {job.worker_id ? job.worker_id.slice(0, 8) + '...' : '—'}
              </td>
              <td className="table-cell text-text-secondary text-xs">
                {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : '—'}
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onRetry && (
                    <button
                      onClick={() => onRetry(job.id)}
                      className="p-1.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 transition-all"
                      title="Retry"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onCancel && ['queued', 'scheduled'].includes(job.status) && (
                    <button
                      onClick={() => onCancel(job.id)}
                      className="p-1.5 rounded text-text-secondary hover:text-error hover:bg-error/10 transition-all"
                      title="Cancel"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
