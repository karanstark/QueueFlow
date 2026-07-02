import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Database, Save, Loader2 } from 'lucide-react';

const CreateQueue = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Create project if it doesn't exist, we just need a default one for MVP
      let projectId = 1;
      try {
        const projRes = await api.post('/api/projects/', { name: "Default Project" });
        projectId = projRes.data.id;
      } catch (e) {
        // Assume default project exists if it fails (simplification for MVP)
      }
      
      await api.post(`/api/queues/`, { name, project_id: projectId });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create queue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
          <Database className="mr-3 text-blue-500" size={32} />
          Create New Queue
        </h1>
        <p className="text-gray-400">Initialize a new job queue to start processing distributed tasks.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8">
        {error && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Queue Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. email-sending-queue"
              className="w-full glass-input px-4 py-3 text-white placeholder-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full glow-btn flex items-center justify-center py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Save className="mr-2" size={20} />
            )}
            Create Queue
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQueue;
