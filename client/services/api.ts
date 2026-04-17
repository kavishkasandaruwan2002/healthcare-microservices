import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useLoadingStore } from '@/store/loadingStore';

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
      useLoadingStore.getState().increment();
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      useLoadingStore.getState().decrement();
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      useLoadingStore.getState().decrement();
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      useLoadingStore.getState().decrement();
      if (error.response?.status === 401 && !error.config.url?.endsWith('login')) {
        // Token expired or unauthorized (but not a failed login attempt)
        const authStore = useAuthStore.getState();
        authStore.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
