import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lims_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lims_token'));
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('lims_token', newToken);
    localStorage.setItem('lims_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('lims_token', newToken);
    localStorage.setItem('lims_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (e) {}
    localStorage.removeItem('lims_token');
    localStorage.removeItem('lims_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = (updatedUser) => {
    const newUser = { ...user, ...updatedUser };
    localStorage.setItem('lims_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const isAuthenticated = !!token && !!user;
  const hasRole = (...roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
