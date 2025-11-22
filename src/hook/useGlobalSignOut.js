// src/hooks/useGlobalSignOut.js
import { useCallback } from 'react';

export const useGlobalSignOut = () => {
  const handleGlobalSignOut = useCallback(async () => {
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');

      // Try backend logout
      try {
        const response = await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'Tenant-ID': tenantId
          },
          body: JSON.stringify({
            tenantId: tenantId
          })
        });
        
        if (response.ok) {
          console.log('Backend logout successful');
        }
      } catch (error) {
        console.log('Backend logout failed, continuing with client-side cleanup');
      }

      // Clear all storage
      const itemsToRemove = [
        'sessionToken',
        'token',
        'userEmail',
        'userId',
        'userName',
        'authToken',
        'refreshToken',
        'isLoggedIn',
        'last2FAVerification',
        'globalSettings',
        'userCurrency',
        'userTimezone'
      ];
      
      itemsToRemove.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      });

      // Clear cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Redirect to login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Global sign out error:', error);
      throw error;
    }
  }, []);

  return { handleGlobalSignOut };
};