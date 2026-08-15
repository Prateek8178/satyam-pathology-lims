import api from './api';
export const getStats = () => api.get('/dashboard/stats');
export const getChartData = () => api.get('/dashboard/charts');
