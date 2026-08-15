import api from './api';
export const getAll = (params) => api.get('/tests', { params });
export const create = (data) => api.post('/tests', data);
export const getById = (id) => api.get(`/tests/${id}`);
export const update = (id, data) => api.put(`/tests/${id}`, data);
export const addParameter = (testId, data) => api.post(`/tests/${testId}/parameters`, data);
export const updateParameter = (testId, paramId, data) => api.put(`/tests/${testId}/parameters/${paramId}`, data);
export const deleteParameter = (testId, paramId) => api.delete(`/tests/${testId}/parameters/${paramId}`);
export const getCategories = () => api.get('/tests/categories');
