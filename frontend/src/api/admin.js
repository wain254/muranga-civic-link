import api from './axios';

export const getAllRequests = async () => {
  const response = await api.get('/api/admin/requests');
  return response.data;
};

export const getAnalytics = async () => {
  const response = await api.get('/api/admin/analytics');
  return response.data;
};

// UPDATED: Now accepts department and evidence file
export const updateRequestStatus = async (id, status, department, evidenceFile) => {
  const formData = new FormData();
  formData.append('status', status);
  formData.append('department', department);
  if (evidenceFile) {
    formData.append('evidence', evidenceFile);
  }

  const response = await api.put(`/api/admin/requests/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};