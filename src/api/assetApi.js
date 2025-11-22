import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const assetApi = {
  getAssets: (userId) => api.get(`/assets?userId=${userId}`),
  
  getAsset: (id) => api.get(`/assets/${id}`),
  
  createAsset: (assetData) => api.post('/assets', assetData),
  
  updateAsset: (id, assetData) => api.put(`/assets/${id}`, assetData),
  
  deleteAsset: (id) => api.delete(`/assets/${id}`),
  
  getSuggestions: (userId) => api.get(`/assets/suggestions?userId=${userId}`)
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;