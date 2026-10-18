// Request API functions

import api from './axios';

export const getMyRequests = async () => {
  const response = await api.get('/api/requests/me');
  return response.data;
};

export const submitRequest = async (formData) => {
  const response = await api.post('/api/requests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};