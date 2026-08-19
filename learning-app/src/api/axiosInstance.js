import axios from 'axios';

const getDefaultBaseURL = () => {
  return process.env.REACT_APP_API_BASE_URL || 'https://learning-plat-y635.onrender.com';
};

const rawBaseURL = getDefaultBaseURL();
const normalizeBaseURL = (url) => {
  if (!url) return 'https://learning-plat-y635.onrender.com/api';
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const api = axios.create({
  baseURL: normalizeBaseURL(rawBaseURL),
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('elearn_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — will be handled by AuthContext
      localStorage.removeItem('elearn_token');
    }
    return Promise.reject(error);
  }
);

export default api;
