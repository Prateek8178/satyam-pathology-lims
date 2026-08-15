import api from './api';
export const getAll = (params) => api.get('/invoices', { params });
export const create = (data) => api.post('/invoices', data);
export const getById = (id) => api.get(`/invoices/${id}`);
export const addPayment = (id, data) => api.post(`/invoices/${id}/payments`, data);
export const getPaymentHistory = (id) => api.get(`/invoices/${id}/payments`);
export const getFinancialSummary = () => api.get('/invoices/summary');
