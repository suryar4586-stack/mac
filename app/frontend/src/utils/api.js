import axios from 'axios';

// In production (Vercel) API is on same domain → use relative /api
// In local dev → Vite proxy forwards /api to localhost:5000
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach JWT on every request
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('stackos_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Global 401 → clear token and redirect to login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('stackos_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
