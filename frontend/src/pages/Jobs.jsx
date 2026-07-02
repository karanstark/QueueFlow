import React, { useEffect, useState } from 'react';
import { jobsAPI, queuesAPI, projectsAPI } from '../services/api';
import JobTable from '../components/JobTable';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { ListChecks, Plus, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [queues, setQueues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { payload: '{\n  "task": "send_email",\n  "to": "user@example.com"\n}', max_retries: 3, retry_strategy: 'exponential' }
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const projRes = await projectsAPI.list();
      setProjects(projRes.data);
      const allQueues = [], allJobs = [];
      for (const p of projRes.data) {
        const qRes = await queuesAPI.list(p.id);
        allQueues.push(...qRes.data);
        for (const q of qRes.data) {
          const jRes = await jobsAPI.list(q.id);
          // Handle both paginated and plain array responses
          const items = jRes.data?.items ?? jRes.data ?? [];
          allJobs.push(...items.map(j => ({ ...j, queue_name: q.name })));
        }
      }
      setQueues(allQueues);
      setJobs(allJobs);
    } catch { setError('Failed to load jobs.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const onSubmit = async (data) => {
    setCreating(true);
    try {
      JSON.parse(data.payload);
    } catch {
      setError('Invalid JSON payload.'); setCreating(false); return;
    }
    try {
      await jobsAPI.create({
        queue_id: parseInt(data.queue_id),
        payload: JSON.parse(data.payload),
        max_retries: parseInt(data.max_retries),
        retry_strategy: data.retry_strategy,
      });
      reset({ payload: '{\n  "task": "send_email",\n  "to": "user@example.com"\n}', max_retries: 3, retry_strategy: 'exponential' });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch job.');
    } finally { setCreating(false); }
  };

  const filtered = filterStatus === 'all' ? jobs : jobs.filter(j => j.status === filterStatus);
  const statuses = ['all', 'queued', 'running', 'completed', 'failed', 'dead_letter'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Jobs</h1>
          <p className="text-text-secondary text-sm mt-1">{jobs.length} total jobs across all queues</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAll} className="glass-btn glass-btn-secondary text-sm"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(true)} className="glass-btn glass-btn-primary text-sm"><Plus className="w-4 h-4" /> Dispatch Job</button>
        </div>
      </div>

      {error && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-3">{error}</div>}

      {/* Dispatch Form */}
      {showForm && (
        <div className="glass-panel p-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Dispatch New Job</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Queue</label>
              <select {...register('queue_id', { required: true })} className="glass-input w-full">
                <option value="">Select a queue</option>
                {queues.map(q => <option key={q.id} value={q.id}>{q.name} (ID: {q.id})</option>)}
              </select>
              {errors.queue_id && <p className="text-error text-xs mt-1">Queue required</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">JSON Payload</label>
              <textarea {...register('payload', { required: true })} rows={4} className="glass-input w-full font-mono text-sm resize-none" />
              {errors.payload && <p className="text-error text-xs mt-1">Payload required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Max Retries</label>
              <input {...register('max_retries')} type="number" min="0" max="10" className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Retry Strategy</label>
              <select {...register('retry_strategy')} className="glass-input w-full">
                <option value="exponential">Exponential Backoff</option>
                <option value="linear">Linear</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={creating} className="glass-btn glass-btn-primary text-sm">
                {creating ? 'Dispatching...' : 'Dispatch Job'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="glass-btn glass-btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filterStatus === s ? 'bg-accent text-white' : 'bg-dark-surface text-text-secondary hover:text-text-primary border border-dark-border'}`}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')} {s !== 'all' && `(${jobs.filter(j => j.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner text="Loading jobs..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No Jobs Found" description="Dispatch your first job to see it appear here." />
      ) : (
        <JobTable jobs={filtered} />
      )}
    </div>
  );
}
