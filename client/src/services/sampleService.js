import api from './api';
export const getAll = (params) => api.get('/samples', { params });
export const getPending = () => api.get('/samples/pending');
export const getByOrder = (orderId) => api.get(`/samples/order/${orderId}`);
export const getById = (id) => api.get(`/samples/${id}`);
export const collect = (id, data) => api.post(`/samples/${id}/collect`, data);
export const reject = (id, reason) => api.post(`/samples/${id}/reject`, { reason });
