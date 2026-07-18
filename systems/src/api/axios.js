import axios from 'axios';

const api = axios.create({
  // Tulis langsung di sini, jangan ambil dari mana-mana dulu
  baseURL: 'https://tarakanartclass-production.up.railway.app'
});

// Interceptor Request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;