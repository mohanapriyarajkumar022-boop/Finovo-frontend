//service/assetService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const assetService = {
  // Get all assets
  getAllAssets: async () => {
    const response = await axios.get(`${API_URL}/assets`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // Get single asset
  getAsset: async (id) => {
    const response = await axios.get(`${API_URL}/assets/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // Create asset
  createAsset: async (assetData) => {
    const response = await axios.post(`${API_URL}/assets`, assetData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // Update asset
  updateAsset: async (id, assetData) => {
    const response = await axios.put(`${API_URL}/assets/${id}`, assetData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // Delete asset
  deleteAsset: async (id) => {
    const response = await axios.delete(`${API_URL}/assets/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // Get AI forecast
  getForecast: async (id, years = 5) => {
    const response = await axios.get(`${API_URL}/assets/${id}/forecast?years=${years}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // Get portfolio stats
  getPortfolioStats: async () => {
    const response = await axios.get(`${API_URL}/assets/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }
};

export default assetService;