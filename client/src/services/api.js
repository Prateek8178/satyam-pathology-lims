import axios from 'axios';

// In production (Vercel), VITE_API_URL will be set to your Render backend URL
// In development, Vite proxy handles /api → localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lims_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error