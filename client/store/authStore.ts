import { create } from 'zustand';

export interface User {
  id: string; // Changed from number to string to handle MongoDB IDs
  email: string;
  role: 'ROLE_PATIENT' | 'ROLE_DOCTOR' | 'ROLE_ADMIN' | 'PATIENT' | 'DOCTOR' | 'ADMIN';
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe JSON parse to handle "undefined" string or null
  const getInitialUser = () => {
    if (typeof window === 'undefined') return null;
    const storedUser = localStorage.getItem('user');
    if (!storedUser || storedUser === 'undefined') return null;
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      return null;
    }
  };

  return {
    user: getInitialUser(),
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  
    login: (user, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
      }
      set({ user, token, isAuthenticated: true });
    },
    
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
