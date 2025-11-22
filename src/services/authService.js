// authService.js
class AuthService {
  // Get token from all possible storage locations
  getToken() {
    const token = 
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token') ||
      (localStorage.getItem('userSession') ? JSON.parse(localStorage.getItem('userSession'))?.token : null);
    
    console.log('🔐 Retrieved token:', token ? '***' + token.slice(-10) : 'none');
    return token;
  }

  // Get tenant ID from all possible storage locations
  getTenantId() {
    const tenantId = 
      localStorage.getItem('tenantId') ||
      sessionStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id') ||
      sessionStorage.getItem('tenant_id') ||
      (localStorage.getItem('userSession') ? JSON.parse(localStorage.getItem('userSession'))?.user?.tenantId : null) ||
      (localStorage.getItem('userSession') ? JSON.parse(localStorage.getItem('userSession'))?.tenantId : null);
    
    console.log('🔐 Retrieved tenant ID:', tenantId || 'none');
    return tenantId;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    const tenantId = this.getTenantId();
    const isAuth = !!(token && tenantId);
    console.log('🔐 Authentication status:', isAuth);
    return isAuth;
  }

  // Logout - clear all auth data
  logout() {
    console.log('🔐 Logging out - clearing all auth data');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('userId');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userSession');
    localStorage.removeItem('redirectAfterLogin');
    
    // Clear sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tenantId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('tenant_id');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('userSession');
    
    // Clear any global variables
    if (typeof window !== 'undefined') {
      window.sessionToken = null;
      window.sessionUser = null;
      window.tenantId = null;
    }
    
    console.log('✅ All auth data cleared');
  }

  // Save auth data consistently (optional - mainly used by AuthPage)
  saveAuthData(token, tenantId, userId) {
    console.log('💾 Saving auth data:', {
      token: token ? '***' + token.slice(-10) : 'none',
      tenantId: tenantId || 'none',
      userId: userId || 'none'
    });
    
    // Save to localStorage (persistent)
    if (token) localStorage.setItem('token', token);
    if (tenantId) localStorage.setItem('tenantId', tenantId);
    if (userId) localStorage.setItem('userId', userId);
    
    console.log('✅ Auth data saved to storage');
  }
}

export default new AuthService();