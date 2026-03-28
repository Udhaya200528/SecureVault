import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 30000,
});
// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sv_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sv_token');
      localStorage.removeItem('sv_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ── Keys ──────────────────────────────────────────────────────────────────────
export const keysAPI = {
  generate: (keyPassword) => api.post('/keys/generate', { keyPassword }),
  getInfo: () => api.get('/keys/info'),
  getPublicKey: (email) => api.get(`/keys/public/${encodeURIComponent(email)}`),
};

// ── Files ─────────────────────────────────────────────────────────────────────
export const filesAPI = {
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
    }),
  download: (fileId, keyPassword) =>
    api.post(`/files/download/${fileId}`, null, {
      params: { keyPassword },
      responseType: 'blob',
    }),
  share: (fileId) => api.post(`/files/${fileId}/share`),
  getSharedInfo: (token) => api.get(`/files/share/${token}`),
  delete: (fileId) => api.delete(`/files/${fileId}`),
  getReceived: () => api.get('/files/received'),
  getSent: () => api.get('/files/sent'),
  getStats: () => api.get('/files/stats'),
};

// ── Audit ─────────────────────────────────────────────────────────────────────
export const auditAPI = {
  getLogs: (page = 0, size = 20) => api.get('/audit', { params: { page, size } }),
};

export default api;