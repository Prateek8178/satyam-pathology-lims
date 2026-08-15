import api from './api';
export const getInbox = (params) => api.get('/lis/inbox', { params });
export const getUnmatched = () => api.get('/lis/unmatched');
export const matchManually = (id, sampleId) => api.post(`/lis/${id}/match`, { sampleId });
export const getStatus = () => api.get('/lis/status');
export const injectMock = (data) => api.post('/lis/inject', data);
export const getAnalyzers = () => api.get('/lis/analyzers');
