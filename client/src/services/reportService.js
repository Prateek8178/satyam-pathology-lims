import api from './api';
export const generate = (data) => api.post('/reports', data);
export const getById = (id) => api.get(`/reports/${id}`);
export const getPDFUrl = (id) => api.get(`/reports/${id}/pdf`);
export const getAll = (params) => api.get('/reports', { params });
export const search = (params) => api.get('/reports/search', { params });
export const regenerate = (id) => api.post(`/reports/${id}/regenerate`);
export const getByPatient = (patientId) => api.get(`/reports/patient/${patientId}`);
