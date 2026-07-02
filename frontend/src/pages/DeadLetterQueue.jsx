import React, { useState, useEffect } from 'react';
import { dlqAPI, jobsAPI, queuesAPI, projectsAPI } from '../services/api';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { Skull, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DeadLetterQueue() {
  const [dlqJobs, setDlqJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDlq = async () => {
    setLoading(true);
    try {
      // Try dedicated DLQ endpoint; fallback to filtering failed jobs from all queues
      try {
        const res = await dlqAPI.list();
        setDlqJobs(res.data);
      } catch {
        // Fallback: collect failed jobs from all queues
        const projRes = await projectsAPI.list();
        const failed = [];
        for (const p of projRes.data) {
          const qRes = await queuesAPI.list(p.id);
          for (const q of qRes.data) {
            const jRes = await jobsAPI.list(q.id);
            failed.push(...jRes.data.filter(j => j.status === 'failed').map(j => ({ ...j, queue_name: q.name })));
          }
        }
        setDlqJobs(failed);
      }
    } catch { setError('Failed to load dead letter queue.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDlq(); }, []);

  const handleRetry = async (id) => {
    try {
      await dlqAPI.retry(id);
      fetchDlq();
    } catch { setError('Failed to retry job.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this failed job?')) return;
    try {
      await dlqAPI.delete(id);
      setDlqJobs(prev => prev.filter(j => j.id !== id));
    } catch { setError('Failed to delete job.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Skull className="w-7 h-7 text-purple-400" /> Dead Letter Queue
          </h1>
          <p className="text-text-secondary text-sm mt-1">Jobs that exceeded maximum retry attempts</p>
        </div>
        <button onClick={fetchDlq} className="glass-btn glass-btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-3">{error}</div>}

      {dlqJobs.length > 0 && (
        <div className="bg-purple-500/5 border border-purple-500/20 text-purple-300 text-sm rounded-lg p-4 flex items-center gap-3">
          <Skull className="w-5 h-5 shrink-0" />
          <p>{dlqJobs.length} failed job(s) in the dead letter queue. Review and retry or discard them.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner text="Loading DLQ..." /></div>
      ) : dlqJobs.length === 0 ? (
        <EmptyState icon={Skull} title="Dead Letter Queue is Empty" description="Great! No jobs have exceeded their retry limits. All clear." />
      ) : (
        <div className="space-y-3">
          {dlqJobs.map(job => (
            <div key={job.id} className="glass-card p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">#{job.id}</span>
                  <span className="text-xs text-text-secondary">Queue: {job.queue_name || `#${job.queue_id}`}</span>
                  <span className="text-xs text-text-secondary">
                    {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : ''}
                  </span>
                </div>
                <div className="bg-error/5 border border-error/20 rounded-lg p-3">
                  <p className="text-xs text-error font-medium mb-1">Error / Failure Reason</p>
                  <p className="text-xs text-text-secondary font-mono">
                    Max retries ({job.max_retries}) exceeded. Last retry: {job.retry_count} attempt(s).
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-text-secondary">
                  <span>Attempts: <strong className="text-text-primary">{job.retry_count}/{job.max_retries}</strong></span>
                  <span>Strategy: <strong className="text-text-primary capitalize">{job.retry_strategy}</strong></span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => handleRetry(job.id)}
                  className="glass-btn glass-btn-primary text-xs py-1.5 px-3">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
                <button onClick={() => handleDelete(job.id)}
                  className="glass-btn glass-btn-danger text-xs py-1.5 px-3">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
