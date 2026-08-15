import api from './api';
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (data) => api.post('/auth/register', data);
export const logout = () => api.post('/auth/logout');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const changePassword = (data) => api.post('/auth/change-password', data);
export const getMe = () => api.get('/auth/me');
