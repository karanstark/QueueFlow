import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally (no forced redirect — auth is optional)
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// --- Auth ---
export const authAPI = {
  // Login uses OAuth2PasswordRequestForm — must be sent as form-urlencoded, not JSON
  login: (data) => {
    const form = new URLSearchParams();
    form.append('username', data.username);
    form.append('password', data.password);
    return api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
};

// --- Projects ---
export const projectsAPI = {
  list: () => api.get('/api/projects/'),
  create: (data) => api.post('/api/projects/', data),
  delete: (id) => api.delete(`/api/projects/${id}/`),
};

// --- Queues ---
export const queuesAPI = {
  list: (projectId) => api.get('/api/queues/', { params: { project_id: projectId } }),
  create: (data) => api.post('/api/queues/', data),
  pause: (id) => api.patch(`/api/queues/${id}/pause/`),
  resume: (id) => api.patch(`/api/queues/${id}/resume/`),
  delete: (id) => api.delete(`/api/queues/${id}/`),
};

// --- Jobs ---
export const jobsAPI = {
  list: (queueId, { status, priority, page = 1, pageSize = 50 } = {}) =>
    api.get('/api/jobs/', { params: { queue_id: queueId, status, priority, page, page_size: pageSize } }),
  get: (id) => api.get(`/api/jobs/${id}`),
  create: (data) => api.post('/api/jobs/', data),
  cancel: (id) => api.patch(`/api/jobs/${id}/cancel/`),
  retry: (id) => api.patch(`/api/jobs/${id}/retry/`),
};

// --- Workers ---
export const workersAPI = {
  list: () => api.get('/api/workers/'),
};

// --- Stats (Dashboard) ---
export const statsAPI = {
  getDashboard: () => api.get('/api/stats/'),
  getCharts: () => api.get('/api/stats/charts'),
};

// --- Logs ---
export const logsAPI = {
  list: (jobId) => api.get('/api/logs/', { params: { job_id: jobId } }),
};

// --- Dead Letter Queue ---
export const dlqAPI = {
  list: () => api.get('/api/dlq/'),
  retry: (id) => api.post(`/api/dlq/${id}/retry/`),
  delete: (id) => api.delete(`/api/dlq/${id}/`),
};

export default api;
