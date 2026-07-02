import React, { useEffect, useState } from 'react';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { Folder, Plus, Trash2, Key, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatDistanceToNow } from 'date-fns';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.list();
      setProjects(res.data);
    } catch { setError('Failed to load projects.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const onSubmit = async (data) => {
    setCreating(true);
    try {
      await projectsAPI.create(data);
      reset();
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project.');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its queues?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch { setError('Failed to delete project.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary text-sm mt-1">Organize your queues and jobs by project</p>
        </div>
        <button onClick={() => setShowForm(true)} className="glass-btn glass-btn-primary text-sm">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {error && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-3">{error}</div>}

      {/* Create Form */}
      {showForm && (
        <div className="glass-panel p-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Create Project</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Project Name</label>
              <input {...register('name', { required: 'Name is required' })} placeholder="e.g., email-service" className="glass-input w-full" />
              {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Description (optional)</label>
              <input {...register('description')} placeholder="Brief description of this project" className="glass-input w-full" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="glass-btn glass-btn-primary text-sm">
                {creating ? 'Creating...' : 'Create Project'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="glass-btn glass-btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner text="Loading projects..." /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon={Folder} title="No Projects Yet" description="Create your first project to start organizing queues and jobs." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-dark-border">
          <table className="table-container">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Project</th>
                <th className="table-cell">Owner</th>
                <th className="table-cell">API Key</th>
                <th className="table-cell">Created</th>
                <th className="table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="table-row group">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 text-accent rounded-lg"><Folder className="w-4 h-4" /></div>
                      <div>
                        <p className="font-medium text-text-primary">{project.name}</p>
                        {project.description && <p className="text-xs text-text-secondary">{project.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-text-secondary">{user?.username}</td>
                  <td className="table-cell">
                    <code className="font-mono text-xs text-accent bg-accent/10 px-2 py-1 rounded">
                      {project.api_key?.slice(0, 12)}...
                    </code>
                  </td>
                  <td className="table-cell text-text-secondary text-xs">
                    {project.created_at ? formatDistanceToNow(new Date(project.created_at), { addSuffix: true }) : '—'}
                  </td>
                  <td className="table-cell">
                    <button onClick={() => handleDelete(project.id)}
                      className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
