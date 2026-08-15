import api from './api';
export const getAll = (params) => api.get('/home-collection', { params });
export const create = (data) => api.post('/home-collection', data);
export const getById = (id) => api.get(`/home-collection/${id}`);
export const update = (id, data) => api.put(`/home-collection/${id}`, data);
export const assign = (id, data) => api.post(`/home-collection/${id}/assign`, data);
export const complete = (id) => api.post(`/home-collection/${id}/complete`);
