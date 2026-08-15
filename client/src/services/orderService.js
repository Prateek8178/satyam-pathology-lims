import api from './api';
export const getAll = (params) => api.get('/orders', { params });
export const create = (data) => api.post('/orders', data);
export const getById = (id) => api.get(`/orders/${id}`);
export const updateStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const cancel = (id) => api.post(`/orders/${id}/cancel`);
