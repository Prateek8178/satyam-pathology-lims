import api from './api';
export const getAll = (params) => api.get('/inventory', { params });
export const getById = (id) => api.get(`/inventory/${id}`);
export const create = (data) => api.post('/inventory', data);
export const update = (id, data) => api.put(`/inventory/${id}`, data);
export const stockIn = (id, data) => api.post(`/inventory/${id}/stock-in`, data);
export const stockOut = (id, data) => api.post(`/inventory/${id}/stock-out`, data);
export const getLowStock = () => api.get('/inventory/low-stock');
export const getTransactions = (itemId) => api.get(`/inventory/${itemId}/transactions`);
