import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import type { LoginResponse } from '../api/auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  setAuth: (data: LoginResponse) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
const INACTIVE_TIMEOUT = 30 * 60 * 1000;

function resetInactivityTimer(logout: () => void) {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(logout, INACTIVE_TIMEOUT);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = import.meta.env.BASE_URL + 'login';
  }, []);

  const setAuth = useCallback((data: LoginResponse) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }, []);

  useEffect(() => {
    if (token) {
      resetInactivityTimer(logout);
      const handler = () => resetInactivityTimer(logout);
      window.addEventListener('mousemove', handler);
      window.addEventListener('keydown', handler);
      return () => {
        window.removeEventListener('mousemove', handler);
        window.removeEventListener('keydown', handler);
        if (inactivityTimer) clearTimeout(inactivityTimer);
      };
    }
    setLoading(false);
  }, [token, logout]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setAuth(res.data.data);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin: user?.role === 'admin', setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
