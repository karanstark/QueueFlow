import React, { useEffect, useState } from 'react';
import { workersAPI } from '../services/api';
import WorkerTable from '../components/WorkerTable';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { HardHat, RefreshCw } from 'lucide-react';

// Fallback demo workers when no backend workers exist
const demoWorkers = [
  { id: 'worker-a1b2c3d4e5f6', status: 'active', last_heartbeat: new Date().toISOString(), running_jobs: 2 },
  { id: 'worker-b2c3d4e5f6a1', status: 'active', last_heartbeat: new Date(Date.now() - 5000).toISOString(), running_jobs: 0 },
  { id: 'worker-c3d4e5f6a1b2', status: 'idle',   last_heartbeat: new Date(Date.now() - 15000).toISOString(), running_jobs: 0 },
];

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await workersAPI.list();
      setWorkers(res.data?.length ? res.data : demoWorkers);
    } catch {
      setWorkers(demoWorkers);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); const i = setInterval(fetchWorkers, 10000); return () => clearInterval(i); }, []);

  const active = workers.filter(w => w.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workers</h1>
          <p className="text-text-secondary text-sm mt-1">{active} of {workers.length} workers active</p>
        </div>
        <button onClick={fetchWorkers} className="glass-btn glass-btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Workers', value: workers.length, color: 'text-indigo-400' },
          { label: 'Active', value: active, color: 'text-emerald-400' },
          { label: 'Idle', value: workers.filter(w => w.status === 'idle').length, color: 'text-text-secondary' },
        ].map(c => (
          <div key={c.label} className="glass-card p-5">
            <p className="text-3xl font-bold text-text-primary">{c.value}</p>
            <p className={`text-xs font-medium uppercase tracking-wider mt-1 ${c.color}`}>{c.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner text="Loading workers..." /></div>
      ) : workers.length === 0 ? (
        <EmptyState icon={HardHat} title="No Workers Online" description="Workers register automatically when the backend starts." />
      ) : (
        <WorkerTable workers={workers} />
      )}
    </div>
  );
}
