import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sv_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { token, email: e, fullName, keyGenerated } = res.data.data;
      localStorage.setItem('sv_token', token);
      const u = { email: e, fullName, keyGenerated };
      localStorage.setItem('sv_user', JSON.stringify(u));
      setUser(u);
      toast.success(`Welcome back, ${fullName}!`);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, fullName, password) => {
    setLoading(true);
    try {
      const res = await authAPI.register({ email, fullName, password });
      const { token, email: e, fullName: fn, keyGenerated } = res.data.data;
      localStorage.setItem('sv_token', token);
      const u = { email: e, fullName: fn, keyGenerated };
      localStorage.setItem('sv_user', JSON.stringify(u));
      setUser(u);
      toast.success('Account created successfully!');
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sv_token');
    localStorage.removeItem('sv_user');
    setUser(null);
    toast.success('Logged out');
  }, []);

  const updateKeyStatus = useCallback((generated) => {
    setUser(prev => {
      const updated = { ...prev, keyGenerated: generated };
      localStorage.setItem('sv_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateKeyStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};