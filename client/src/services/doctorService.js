import api from './api';
export const getAll = (params) => api.get('/doctors', { params });
export const create = (data) => api.post('/doctors', data);
export const getById = (id) => api.get(`/doctors/${id}`);
export const update = (id, data) => api.put(`/doctors/${id}`, data);
export const getStats = (id) => api.get(`/doctors/${id}/stats`);
