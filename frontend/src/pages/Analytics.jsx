import React, { useEffect, useState } from 'react';
import { ThroughputChart, QueueDistributionChart, WorkerUtilizationChart, FailureRateChart } from '../components/Charts';
import { statsAPI } from '../services/api';

export default function Analytics() {
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await statsAPI.getCharts();
        setCharts(res.data);
      } catch { /* silently use null — charts fall back gracefully */ }
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  const avgDuration = charts?.avg_duration_ms
    ? charts.avg_duration_ms > 1000
      ? `${(charts.avg_duration_ms / 1000).toFixed(1)}s`
      : `${charts.avg_duration_ms.toFixed(0)}ms`
    : '—';

  const successRate = charts ? `${charts.success_rate}%` : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Real-time insights into your job processing performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <h2 className="text-sm font-semibold text-text-primary">Job Throughput</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">Completed vs. failed jobs over the last 12 hours</p>
          <ThroughputChart data={charts?.throughput} />
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-semibold text-text-primary">Queue Distribution</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">Job share per queue</p>
          <QueueDistributionChart data={charts?.queue_distribution} />
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <h2 className="text-sm font-semibold text-text-primary">Worker Utilization</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">CPU & memory per worker instance</p>
          <WorkerUtilizationChart data={charts?.worker_utilization} />
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <h2 className="text-sm font-semibold text-text-primary">Failure Rate</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">Percentage of failed jobs over the last 7 days</p>
          <FailureRateChart data={charts?.failure_rate} />
        </div>
      </div>

      {/* Summary boxes — real data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Processing Time', value: avgDuration, sub: 'per job' },
          { label: 'Success Rate', value: successRate, sub: 'all time' },
          { label: 'Active Workers', value: charts ? (charts.worker_utilization?.length ?? '—') : '—', sub: 'right now' },
          { label: 'Queues Tracked', value: charts ? (charts.queue_distribution?.filter(q => q.name !== 'No data').length ?? '—') : '—', sub: 'with jobs' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-2xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs font-medium text-accent mt-1">{s.label}</p>
            <p className="text-xs text-text-secondary">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
