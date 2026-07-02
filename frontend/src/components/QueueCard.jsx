import React from 'react';
import { Layers, Pause, Play, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function QueueCard({ queue, onPause, onResume, onDelete }) {
  const isPaused = queue.status === 'paused';

  return (
    <div className="glass-card p-5 flex flex-col gap-4 group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{queue.name}</h3>
            <p className="text-xs text-text-secondary mt-0.5">ID: {queue.id}</p>
          </div>
        </div>
        <StatusBadge status={queue.status || 'active'} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-dark/50 rounded-lg p-3">
          <p className="text-xs text-text-secondary uppercase tracking-wide">Priority</p>
          <p className="font-medium text-text-primary mt-1 capitalize">{queue.priority || 'normal'}</p>
        </div>
        <div className="bg-dark/50 rounded-lg p-3">
          <p className="text-xs text-text-secondary uppercase tracking-wide">Jobs</p>
          <p className="font-medium text-text-primary mt-1">{queue.job_count ?? 0}</p>
        </div>
        <div className="bg-dark/50 rounded-lg p-3">
          <p className="text-xs text-text-secondary uppercase tracking-wide">Concurrency</p>
          <p className="font-medium text-text-primary mt-1">{queue.concurrency_limit ?? 5}</p>
        </div>
        <div className="bg-dark/50 rounded-lg p-3">
          <p className="text-xs text-text-secondary uppercase tracking-wide">Retry Policy</p>
          <p className="font-medium text-text-primary mt-1 capitalize">{queue.retry_policy || 'exponential'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-dark-border opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => isPaused ? onResume?.(queue.id) : onPause?.(queue.id)}
          className={`glass-btn flex-1 text-sm py-1.5 ${isPaused ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
        >
          {isPaused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
        </button>
        <button
          onClick={() => onDelete?.(queue.id)}
          className="glass-btn glass-btn-danger p-1.5"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
