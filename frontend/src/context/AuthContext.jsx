import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('wbs_admin_token'));
  const [adminUser, setAdminUser] = useState(() => {
    const saved = sessionStorage.getItem('wbs_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!token;

  const login = async (username, password) => {
    try {
      const response = await api.post('/login', { username, password });
      if (response.data.success && response.data.token) {
        const userObj = { username: response.data.username || username };
        sessionStorage.setItem('wbs_admin_token', response.data.token);
        sessionStorage.setItem('wbs_admin_user', JSON.stringify(userObj));
        setToken(response.data.token);
        setAdminUser(userObj);
        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Login gagal' };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat login';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/admin/logout').catch(() => {});
      }
    } finally {
      sessionStorage.removeItem('wbs_admin_token');
      sessionStorage.removeItem('wbs_admin_user');
      localStorage.removeItem('wbs_admin_token');
      localStorage.removeItem('wbs_admin_user');
      if (api.defaults.headers.common['Authorization']) {
        delete api.defaults.headers.common['Authorization'];
      }
      setToken(null);
      setAdminUser(null);
      window.location.href = '/admin/login';
    }
  };

  return (
    <AuthContext.Provider value={{ token, adminUser, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
