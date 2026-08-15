import api from './api';
export const getAll = (params) => api.get('/packages', { params });
export const create = (data) => api.post('/packages', data);
export const getById = (id) => api.get(`/packages/${id}`);
export const update = (id, data) => api.put(`/packages/${id}`, data);
