import React, { useEffect, useState } from 'react';
import { queuesAPI, projectsAPI } from '../services/api';
import QueueCard from '../components/QueueCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { Layers, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function Queues() {
  const [queues, setQueues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const projRes = await projectsAPI.list();
      setProjects(projRes.data);
      if (projRes.data.length > 0) {
        // Fetch queues for all projects
        const allQueues = [];
        for (const p of projRes.data) {
          const qRes = await queuesAPI.list(p.id);
          allQueues.push(...qRes.data);
        }
        setQueues(allQueues);
      }
    } catch { setError('Failed to load queues.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const onSubmit = async (data) => {
    setCreating(true);
    try {
      await queuesAPI.create({
        name: data.name,
        project_id: parseInt(data.project_id),
        priority: data.priority || 'normal',
        concurrency_limit: parseInt(data.concurrency_limit) || 5,
        retry_policy: data.retry_policy || 'exponential',
      });
      reset(); setShowForm(false); fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create queue.');
    } finally { setCreating(false); }
  };

  const handlePause = async (id) => {
    try { await queuesAPI.pause(id); fetchAll(); } catch { setError('Failed to pause queue.'); }
  };
  const handleResume = async (id) => {
    try { await queuesAPI.resume(id); fetchAll(); } catch { setError('Failed to resume queue.'); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this queue?')) return;
    try { await queuesAPI.delete(id); setQueues(prev => prev.filter(q => q.id !== id)); }
    catch { setError('Failed to delete queue.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Queues</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your job queues and processing configurations</p>
        </div>
        <button onClick={() => setShowForm(true)} className="glass-btn glass-btn-primary text-sm">
          <Plus className="w-4 h-4" /> New Queue
        </button>
      </div>

      {error && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-3">{error}</div>}

      {showForm && (
        <div className="glass-panel p-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Create Queue</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Queue Name</label>
              <input {...register('name', { required: true })} placeholder="e.g., email-notifications" className="glass-input w-full" />
              {errors.name && <p className="text-error text-xs mt-1">Name required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Project</label>
              <select {...register('project_id', { required: true })} className="glass-input w-full">
                <option value="">Select a project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.project_id && <p className="text-error text-xs mt-1">Project required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Priority</label>
              <select {...register('priority')} className="glass-input w-full">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Concurrency Limit</label>
              <input {...register('concurrency_limit')} type="number" min="1" max="50" defaultValue={5} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Retry Policy</label>
              <select {...register('retry_policy')} className="glass-input w-full">
                <option value="exponential">Exponential Backoff</option>
                <option value="linear">Linear</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div className="flex gap-3 md:col-span-2 items-end">
              <button type="submit" disabled={creating} className="glass-btn glass-btn-primary text-sm">
                {creating ? 'Creating...' : 'Create Queue'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="glass-btn glass-btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner text="Loading queues..." /></div>
      ) : queues.length === 0 ? (
        <EmptyState icon={Layers} title="No Queues Yet" description="Create your first queue to start dispatching jobs." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {queues.map(queue => (
            <QueueCard key={queue.id} queue={queue} onPause={handlePause} onResume={handleResume} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
