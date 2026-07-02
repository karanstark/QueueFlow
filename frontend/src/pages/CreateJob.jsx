import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PlusCircle, Send, Loader2 } from 'lucide-react';

const CreateJob = () => {
  const navigate = useNavigate();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingQueues, setFetchingQueues] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    queue_id: '',
    payload: '{"task": "send_email", "to": "user@example.com"}',
    max_retries: 3,
    retry_strategy: 'exponential',
    retry_delay: 5
  });

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const res = await api.get('/api/stats');
        setQueues(res.data.queues || []);
        if (res.data.queues && res.data.queues.length > 0) {
          setFormData(prev => ({ ...prev, queue_id: res.data.queues[0].id.toString() }));
        }
      } catch (err) {
        console.error("Failed to fetch queues", err);
      } finally {
        setFetchingQueues(false);
      }
    };
    fetchQueues();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.queue_id) {
      setError("Please select a queue. Create one if none exist.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(formData.payload);
      } catch (e) {
        throw new Error("Payload must be valid JSON");
      }

      await api.post(`/api/jobs/`, {
        queue_id: parseInt(formData.queue_id),
        payload: parsedPayload,
        max_retries: parseInt(formData.max_retries),
        retry_strategy: formData.retry_strategy,
        retry_delay: parseInt(formData.retry_delay)
      });
      
      navigate('/');
    } catch (err) {
      setError(err.message || err.response?.data?.detail || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingQueues) {
    return <div className="text-center py-20 text-gray-400">Loading configuration...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
          <PlusCircle className="mr-3 text-purple-500" size={32} />
          Dispatch New Job
        </h1>
        <p className="text-gray-400">Enqueue a new background task for processing.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Target Queue</label>
          {queues.length === 0 ? (
            <div className="text-sm text-red-400 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              No queues found. Please create a queue first.
            </div>
          ) : (
            <select
              name="queue_id"
              value={formData.queue_id}
              onChange={handleChange}
              className="w-full glass-input px-4 py-3 bg-[#111] text-white"
            >
              {queues.map(q => (
                <option key={q.id} value={q.id}>{q.name} (ID: {q.id})</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">JSON Payload</label>
          <textarea
            name="payload"
            value={formData.payload}
            onChange={handleChange}
            rows={4}
            className="w-full glass-input px-4 py-3 text-white font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Retries</label>
            <input
              type="number"
              name="max_retries"
              value={formData.max_retries}
              onChange={handleChange}
              min="0"
              max="10"
              className="w-full glass-input px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Retry Delay (s)</label>
            <input
              type="number"
              name="retry_delay"
              value={formData.retry_delay}
              onChange={handleChange}
              min="1"
              className="w-full glass-input px-4 py-3 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Retry Strategy</label>
          <select
            name="retry_strategy"
            value={formData.retry_strategy}
            onChange={handleChange}
            className="w-full glass-input px-4 py-3 bg-[#111] text-white"
          >
            <option value="fixed">Fixed</option>
            <option value="linear">Linear</option>
            <option value="exponential">Exponential</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || queues.length === 0}
          className="w-full glow-btn flex items-center justify-center py-3 rounded-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2" size={20} />
          ) : (
            <Send className="mr-2" size={20} />
          )}
          Dispatch Job
        </button>
      </form>
    </div>
  );
};

export default CreateJob;
