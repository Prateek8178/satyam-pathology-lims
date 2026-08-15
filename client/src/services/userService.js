import api from './api';
export const getAll = (params) => api.get('/users', { params });
export const create = (data) => api.post('/users', data);
export const getById = (id) => api.get(`/users/${id}`);
export const update = (id, data) => api.put(`/users/${id}`, data);
export const deactivate = (id) => api.post(`/users/${id}/deactivate`);
export const resetPassword = (id, data) => api.post(`/users/${id}/reset-password`, data);
