import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/auth/profile');
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // Pastikan menggunakan 'res' (atau nama variabel yang sama di bawah)
      const res = await api.post('/api/auth/login', { email, password });

      // Pastikan Anda menggunakan 'res.data', BUKAN 'response.data'
      if (res.data && res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        setUser(res.data.user);
        return res.data;
      }
    } catch (err) {
      // Pastikan di sini juga tidak memanggil 'response' yang salah
      console.error("Login gagal:", err);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
