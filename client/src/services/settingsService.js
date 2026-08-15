import api from './api';
export const getLabSettings = () => api.get('/settings/lab');
export const updateLabSettings = (data) => api.put('/settings/lab', data);
export const getLISSettings = () => api.get('/settings/lis');
export const updateLISSettings = (data) => api.put('/settings/lis', data);
