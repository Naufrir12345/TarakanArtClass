import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
// });

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://tarakanartclass-production.up.railway.app',
});

// Interceptor Request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor Response (DI SINI KEMUNGKINAN ERROR-NYA)
api.interceptors.response.use(
  (response) => response,
  (error) => {

    return Promise.reject(error);
  }
);

export default api;