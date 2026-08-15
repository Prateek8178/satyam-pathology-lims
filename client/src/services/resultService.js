import api from './api';
export const getAll = (params) => api.get('/results', { params });
export const getByOrder = (orderId) => api.get(`/results/order/${orderId}`);
export const getByPatient = (patientId) => api.get(`/results/patient/${patientId}`);
export const enterManual = (data) => api.post('/results/manual', data);
export const update = (id, data) => api.put(`/results/${id}`, data);
export const sendForVerification = (id) => api.post(`/results/${id}/verify-request`);
export const verify = (id, data) => api.post(`/results/${id}/verify`, data);
export const reject = (id, reason) => api.post(`/results/${id}/reject`, { reason });
