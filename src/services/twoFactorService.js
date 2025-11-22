// Frontend/src/services/twoFactorService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Tenant-ID': tenantId,
    'X-Tenant-ID': tenantId
  };
};

export const twoFactorService = {
  // Check 2FA status
  checkStatus: async () => {
    try {
      const response = await fetch(`${API_URL}/api/two-factor/status`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to check 2FA status');
      }

      return await response.json();
    } catch (error) {
      console.error('2FA status check error:', error);
      return { success: false, isEnabled: false, requiresVerification: false };
    }
  },

  // Setup 2FA
  setup: async () => {
    try {
      const response = await fetch(`${API_URL}/api/two-factor/setup`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to setup 2FA');
      }

      return await response.json();
    } catch (error) {
      console.error('2FA setup error:', error);
      throw error;
    }
  },

  // Verify 2FA code during setup
  verify: async (code, secret) => {
    try {
      const response = await fetch(`${API_URL}/api/two-factor/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, secret })
      });

      if (!response.ok) {
        throw new Error('Failed to verify 2FA');
      }

      const data = await response.json();
      
      // Set initial verification timestamp when enabling 2FA
      if (data.success) {
        localStorage.setItem('last2FAVerification', new Date().toISOString());
      }
      
      return data;
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    }
  },

  // Verify login code (periodic)
  verifyLogin: async (code) => {
    try {
      const response = await fetch(`${API_URL}/api/two-factor/verify-login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error('Failed to verify login code');
      }

      const data = await response.json();
      
      // Update verification timestamp on successful verification
      if (data.success && data.verified) {
        localStorage.setItem('last2FAVerification', new Date().toISOString());
      }
      
      return data;
    } catch (error) {
      console.error('Login verification error:', error);
      throw error;
    }
  },

  // Verify backup code
  verifyBackup: async (backupCode) => {
    try {
      const response = await fetch(`${API_URL}/api/two-factor/verify-backup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ backupCode })
      });

      if (!response.ok) {
        throw new Error('Failed to verify backup code');
      }

      const data = await response.json();
      
      // Update verification timestamp on successful verification
      if (data.success) {
        localStorage.setItem('last2FAVerification', new Date().toISOString());
      }
      
      return data;
    } catch (error) {
      console.error('Backup code verification error:', error);
      throw error;
    }
  },

  // Disable 2FA
  disable: async () => {
    try {
      const response = await fetch(`${API_URL}/api/two-factor/disable`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      const data = await response.json();
      
      // Clear verification timestamp when disabling
      if (data.success) {
        localStorage.removeItem('last2FAVerification');
      }
      
      return data;
    } catch (error) {
      console.error('2FA disable error:', error);
      throw error;
    }
  }
};