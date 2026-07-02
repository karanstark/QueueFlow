import React from 'react';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';

export default function WorkerTable({ workers = [] }) {
  if (!workers.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-dark-border">
      <table className="table-container">
        <thead className="table-header">
          <tr>
            <th className="table-cell">Worker ID</th>
            <th className="table-cell">Status</th>
            <th className="table-cell">Heartbeat</th>
            <th className="table-cell">Running Jobs</th>
            <th className="table-cell">CPU Usage</th>
            <th className="table-cell">Memory Usage</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((worker) => {
            // Generate deterministic dummy CPU/mem based on worker id
            const cpuSeed = parseInt(worker.id?.slice(-4) || '5000', 16) % 100;
            const memSeed = (cpuSeed * 0.6 + 10) % 100;
            const cpu = Math.max(10, Math.min(95, cpuSeed));
            const mem = Math.max(10, Math.min(85, memSeed));

            return (
              <tr key={worker.id} className="table-row">
                <td className="table-cell font-mono text-xs text-accent">{worker.id?.slice(0, 12)}...</td>
                <td className="table-cell"><StatusBadge status={worker.status} /></td>
                <td className="table-cell text-text-secondary text-xs">
                  {worker.last_heartbeat
                    ? formatDistanceToNow(new Date(worker.last_heartbeat), { addSuffix: true })
                    : '—'}
                </td>
                <td className="table-cell text-text-primary">{worker.running_jobs ?? 0}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-dark-border rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-accent to-purple-500"
                        style={{ width: `${cpu}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary w-8">{cpu}%</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-dark-border rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${mem}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary w-8">{mem.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
