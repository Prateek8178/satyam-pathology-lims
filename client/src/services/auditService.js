import api from './api';
export const getAll = (params) => api.get('/audit', { params });
export const getByEntity = (entity, entityId) => api.get(`/audit/${entity}/${entityId}`);
