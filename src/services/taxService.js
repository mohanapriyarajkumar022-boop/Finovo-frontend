// frontend/src/services/taxService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant ID to all requests
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const taxService = {
  // Get current year tax calculation
  async getCurrentTaxCalculation() {
    try {
      console.log('📊 Fetching current tax calculation...');
      const response = await api.get('/tax/current');
      console.log('✅ Current tax calculation response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching current tax calculation:', error);
      throw error;
    }
  },

  // Get tax rates
  async getTaxRates() {
    try {
      console.log('📋 Fetching tax rates...');
      const response = await api.get('/tax/rates');
      console.log('✅ Tax rates response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching tax rates:', error);
      // Return default rates if API fails
      const currentYear = new Date().getFullYear();
      const defaultRates = {
        financialYear: `${currentYear}-${currentYear + 1}`,
        lastUpdated: new Date().toISOString(),
        source: 'default',
        brackets: [
          { range: "Up to ₹3,00,000", rate: 0, description: "No tax", min: 0, max: 300000, slab: "0-3L" },
          { range: "₹3,00,001 - ₹6,00,000", rate: 5, description: "Tax on amount exceeding ₹3L", min: 300001, max: 600000, slab: "3L-6L" },
          { range: "₹6,00,001 - ₹9,00,000", rate: 10, description: "Tax on amount exceeding ₹6L", min: 600001, max: 900000, slab: "6L-9L" },
          { range: "₹9,00,001 - ₹12,00,000", rate: 15, description: "Tax on amount exceeding ₹9L", min: 900001, max: 1200000, slab: "9L-12L" },
          { range: "₹12,00,001 - ₹15,00,000", rate: 20, description: "Tax on amount exceeding ₹12L", min: 1200001, max: 1500000, slab: "12L-15L" },
          { range: "Above ₹15,00,000", rate: 30, description: "Tax on amount exceeding ₹15L", min: 1500001, max: null, slab: "15L+" }
        ],
        deductions: {
          standard: 75000,
          section80C: 150000,
          section80D: 25000,
          hra: 0,
          medical: 25000,
          nps: 50000
        },
        cess: 0.04
      };
      
      return {
        data: {
          success: true,
          data: defaultRates
        }
      };
    }
  },

  // Get AI recommendations
  async getAIRecommendations() {
    try {
      console.log('🤖 Fetching AI recommendations...');
      const response = await api.get('/tax/ai/recommendations');
      console.log('✅ AI recommendations response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching AI recommendations:', error);
      // Return empty recommendations if API fails
      return {
        data: {
          success: true,
          data: {
            recommendations: [],
            optimizationScore: 0,
            lastUpdated: new Date()
          }
        }
      };
    }
  },

  // Get tax reports
  async getTaxReports() {
    try {
      console.log('📋 Fetching tax reports...');
      const response = await api.get('/tax/reports');
      console.log('✅ Tax reports response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching tax reports:', error);
      // Return empty array if API fails
      return {
        data: {
          success: true,
          data: []
        }
      };
    }
  },

  // Calculate manual tax
  async calculateManualTax(manualIncome) {
    try {
      console.log('🧮 Calculating manual tax for income:', manualIncome);
      const response = await api.post('/tax/calculate/manual', {
        manualIncome: parseFloat(manualIncome)
      });
      console.log('✅ Manual tax calculation response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error calculating manual tax:', error);
      throw error;
    }
  },

  // Reset to income-based tax calculation
  async resetToIncomeTax() {
    try {
      console.log('🔄 Resetting to income-based tax calculation...');
      const response = await api.post('/tax/reset');
      console.log('✅ Reset tax calculation response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error resetting tax calculation:', error);
      throw error;
    }
  },

  // Refresh tax rates (admin function)
  async refreshTaxRates() {
    try {
      console.log('🔄 Refreshing tax rates...');
      const response = await api.post('/tax/rates/refresh');
      console.log('✅ Tax rates refresh response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error refreshing tax rates:', error);
      throw error;
    }
  }
};

export default taxService;