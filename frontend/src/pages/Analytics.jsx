import React from 'react';
import { ThroughputChart, QueueDistributionChart, WorkerUtilizationChart, FailureRateChart } from '../components/Charts';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Deep insights into your job processing performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <h2 className="text-sm font-semibold text-text-primary">Job Throughput</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">Completed vs. failed jobs over the last 12 hours</p>
          <ThroughputChart />
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-semibold text-text-primary">Queue Distribution</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">Job share per queue</p>
          <QueueDistributionChart />
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <h2 className="text-sm font-semibold text-text-primary">Worker Utilization</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">CPU & memory per worker instance</p>
          <WorkerUtilizationChart />
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <h2 className="text-sm font-semibold text-text-primary">Failure Rate</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">Percentage of failed jobs over the last 7 days</p>
          <FailureRateChart />
        </div>
      </div>

      {/* Summary boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Processing Time', value: '1.2s', sub: 'per job' },
          { label: 'P95 Latency', value: '3.8s', sub: 'last 24h' },
          { label: 'Success Rate', value: '98.4%', sub: 'last 7 days' },
          { label: 'Retry Rate', value: '4.1%', sub: 'all time' },
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
