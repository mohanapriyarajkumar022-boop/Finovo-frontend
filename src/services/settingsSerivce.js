// import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// // Create axios instance with auth header
// const getAuthHeader = (token) => {
//   return { Authorization: `Bearer ${token}` };
// };

// // Individual exported functions for ThemeContext
// export const getSettings = async (token) => {
//   try {
//     const response = await axios.get(`${API_URL}/settings`, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error getting settings:', error);
//     throw error;
//   }
// };

// export const updateSettings = async (settingsData, token) => {
//   try {
//     const response = await axios.put(`${API_URL}/settings`, settingsData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error updating settings:', error);
//     throw error;
//   }
// };

// // Service object with all methods
// const settingsService = {
//   // Get all settings
//   getSettings: async (token) => {
//     const response = await axios.get(`${API_URL}/settings`, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update profile
//   updateProfile: async (profileData, token) => {
//     const response = await axios.put(`${API_URL}/settings/profile`, profileData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update theme
//   updateTheme: async (themeData, token) => {
//     const response = await axios.put(`${API_URL}/settings/theme`, themeData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update notifications
//   updateNotifications: async (notificationData, token) => {
//     const response = await axios.put(`${API_URL}/settings/notifications`, notificationData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update privacy
//   updatePrivacy: async (privacyData, token) => {
//     const response = await axios.put(`${API_URL}/settings/privacy`, privacyData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update performance
//   updatePerformance: async (performanceData, token) => {
//     const response = await axios.put(`${API_URL}/settings/performance`, performanceData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update appearance
//   updateAppearance: async (appearanceData, token) => {
//     const response = await axios.put(`${API_URL}/settings/appearance`, appearanceData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update language
//   updateLanguage: async (languageData, token) => {
//     const response = await axios.put(`${API_URL}/settings/language`, languageData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update accessibility
//   updateAccessibility: async (accessibilityData, token) => {
//     const response = await axios.put(`${API_URL}/settings/accessibility`, accessibilityData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Update data settings
//   updateData: async (dataSettings, token) => {
//     const response = await axios.put(`${API_URL}/settings/data`, dataSettings, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Change password
//   changePassword: async (passwordData, token) => {
//     const response = await axios.post(`${API_URL}/settings/change-password`, passwordData, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Export data
//   exportData: async (token) => {
//     const response = await axios.post(`${API_URL}/settings/export-data`, {}, {
//       headers: getAuthHeader(token)
//     });
//     return response.data;
//   },

//   // Delete account
//   deleteAccount: async (password, token) => {
//     const response = await axios.delete(`${API_URL}/settings/delete-account`, {
//       headers: getAuthHeader(token),
//       data: { password }
//     });
//     return response.data;
//   }
// };

// export default settingsService;