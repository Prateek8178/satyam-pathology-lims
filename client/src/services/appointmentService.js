import api from './api';
export const getAll = (params) => api.get('/appointments', { params });
export const create = (data) => api.post('/appointments', data);
export const getById = (id) => api.get(`/appointments/${id}`);
export const update = (id, data) => api.put(`/appointments/${id}`, data);
export const cancel = (id) => api.post(`/appointments/${id}/cancel`);
