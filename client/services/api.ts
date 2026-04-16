import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized
      if (typeof window !== 'undefined') {
        const authStore = useAuthStore.getState();
        authStore.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
