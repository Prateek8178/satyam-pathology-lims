import api from './api';
export const getAll = (params) => api.get('/patients', { params });
export const create = (data) => api.post('/patients', data);
export const getById = (id) => api.get(`/patients/${id}`);
export const update = (id, data) => api.put(`/patients/${id}`, data);
export const getHistory = (id) => api.get(`/patients/${id}/history`);
export const search = (q) => api.get('/patients/search', { params: { q } });
