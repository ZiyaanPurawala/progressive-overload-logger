import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// ✅ Fixed: CRA uses process.env, not import.meta.env
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = API_BASE;

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const id = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('pol_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('pol_token');
    const stored = localStorage.getItem('pol_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await axios.post('/auth/login', { email, password });
      localStorage.setItem('pol_token', data.token);
      localStorage.setItem('pol_user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (name, email, password, unitPreference = 'kg') => {
    setError(null);
    try {
      const { data } = await axios.post('/auth/register', { name, email, password, unitPreference });
      localStorage.setItem('pol_token', data.token);
      localStorage.setItem('pol_user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pol_token');
    localStorage.removeItem('pol_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export { axios };