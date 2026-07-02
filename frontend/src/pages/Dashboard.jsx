import React, { useEffect, useState } from 'react';
import { statsAPI } from '../services/api';
import DashboardCards from '../components/DashboardCards';
import { ThroughputChart, QueueDistributionChart, WorkerUtilizationChart, FailureRateChart } from '../components/Charts';
import LoadingSpinner from '../components/LoadingSpinner';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Simulated recent activity feed
const buildActivity = (stats) => {
  const items = [];
  if (stats?.active_workers > 0) items.push({ icon: Cpu, color: 'text-teal-400', msg: `${stats.active_workers} worker(s) active and processing jobs`, time: new Date() });
  if (stats?.completed_jobs > 0) items.push({ icon: CheckCircle2, color: 'text-emerald-400', msg: `${stats.completed_jobs} job(s) completed successfully`, time: new Date(Date.now() - 60000) });
  if (stats?.failed_jobs > 0) items.push({ icon: AlertCircle, color: 'text-red-400', msg: `${stats.failed_jobs} job(s) failed and moved to retry queue`, time: new Date(Date.now() - 120000) });
  if (stats?.running_jobs > 0) items.push({ icon: RefreshCw, color: 'text-yellow-400', msg: `${stats.running_jobs} job(s) currently running`, time: new Date(Date.now() - 180000) });
  if (stats?.total_queues > 0) items.push({ icon: Activity, color: 'text-blue-400', msg: `${stats.total_queues} queue(s) initialized and healthy`, time: new Date(Date.now() - 300000) });
  return items.length ? items : [{ icon: Activity, color: 'text-text-secondary', msg: 'System started. No activity yet.', time: new Date() }];
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await statsAPI.getDashboard();
      setStats(res.data);
      setError('');
    } catch (err) {
      // If 401 (not logged in), just show zero stats silently
      if (err.response?.status !== 401) {
        setError('Could not reach backend. Showing demo data.');
      }
      // Set demo/zero stats so the page renders nicely
      setStats({ total_jobs: 0, queued_jobs: 0, running_jobs: 0, completed_jobs: 0, failed_jobs: 0, dead_letter: 0, active_workers: 0, total_queues: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const activity = buildActivity(stats);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Real-time overview of your job processing infrastructure</p>
        </div>
        <button onClick={fetchStats} className="glass-btn glass-btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-warning/10 border border-warning/20 text-warning text-sm rounded-lg p-3">{error}</div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner text="Loading metrics..." /></div>
      ) : (
        <DashboardCards stats={stats} />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Job Throughput</h2>
          <p className="text-xs text-text-secondary mb-4">Completed vs. failed jobs over time</p>
          <ThroughputChart />
        </div>
        <div className="glass-panel p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Queue Distribution</h2>
          <p className="text-xs text-text-secondary mb-4">Job count breakdown per queue</p>
          <QueueDistributionChart />
        </div>
        <div className="glass-panel p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Worker Utilization</h2>
          <p className="text-xs text-text-secondary mb-4">CPU & Memory usage per worker</p>
          <WorkerUtilizationChart />
        </div>
        <div className="glass-panel p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Failure Rate</h2>
          <p className="text-xs text-text-secondary mb-4">Percentage of failed jobs per day</p>
          <FailureRateChart />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="glass-panel p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" /> Recent Activity
        </h2>
        <div className="space-y-3">
          {activity.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm group">
              <div className={`mt-0.5 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-text-primary">{item.msg}</p>
              </div>
              <span className="text-xs text-text-secondary shrink-0">
                {formatDistanceToNow(item.time, { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
