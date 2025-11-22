// src/context/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enhanced token validation
  const validateToken = (token) => {
    if (!token) return false;
    if (token.length < 10) return false;
    
    // Basic JWT format check
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    return true;
  };

  // Clear invalid tokens
  const clearInvalidTokens = () => {
    const tokens = ['sessionToken', 'token', 'authToken'];
    tokens.forEach(token => {
      localStorage.removeItem(token);
      sessionStorage.removeItem(token);
    });
    console.log('🔐 Cleared invalid tokens');
  };

  // Get tenant ID from localStorage or generate one if not exists
  const getTenantId = () => {
    let tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
    
    if (!tenantId) {
      tenantId = 'tenant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tenantId', tenantId);
    }
    
    return tenantId;
  };

  // Enhanced load settings with better error handling
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const tenantId = getTenantId();

      console.log('🔐 Auth check:', { 
        hasToken: !!token, 
        tokenLength: token?.length,
        tenantId 
      });

      // If no token or invalid token, use default settings
      if (!token || !validateToken(token)) {
        console.log('👤 No valid token - using default settings');
        if (!validateToken(token)) {
          clearInvalidTokens();
        }
        const defaultSettings = getDefaultSettings();
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/settings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'Tenant-ID': tenantId
          }
        });

        console.log('📡 Settings API Response:', response.status);

        if (response.status === 401) {
          console.warn('🔐 Token expired or invalid - clearing tokens');
          clearInvalidTokens();
          // Use default settings
          const defaultSettings = getDefaultSettings();
          setSettings(defaultSettings);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Settings loaded successfully');
          setSettings(data.data);
          applyGlobalSettings(data.data);
        } else {
          throw new Error(data.message || 'Failed to load settings');
        }
      } catch (fetchError) {
        console.error('📡 Network error fetching settings:', fetchError);
        // Use default settings on network error
        const defaultSettings = getDefaultSettings();
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error('❌ Error loading settings:', err);
      setError(err.message);
      // Set default settings on error
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get default settings
  const getDefaultSettings = () => {
    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
    const userName = localStorage.getItem('userName') || 'User';
    
    return {
      profile: {
        name: userName,
        email: userEmail,
        phone: '',
        bio: '',
        profilePhoto: ''
      },
      account: {
        type: 'individual'
      },
      theme: {
        mode: 'light',
        primaryColor: '#8B5CF6',
        fontSize: 'medium',
        fontFamily: 'Inter'
      },
      notifications: {
        email: true,
        push: true,
        transactionAlerts: true,
        weeklyReports: true,
        budgetAlerts: true,
        securityAlerts: true
      },
      privacy: {
        profileVisibility: 'private',
        showEmail: false,
        twoFactorAuth: false,
        loginAlerts: true
      },
      appearance: {
        compactMode: false,
        showAnimations: true,
        currencySymbol: '$',
        dateFormat: 'MM/DD/YYYY'
      },
      language: {
        appLanguage: 'en',
        locale: 'en',
        currency: 'USD',
        timezone: 'UTC'
      },
      performance: {
        enableCache: true,
        autoSave: true,
        lowDataMode: false
      },
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        screenReader: false,
        keyboardNavigation: false
      }
    };
  };

  // Apply settings globally across the app
  const applyGlobalSettings = (settingsData) => {
    if (!settingsData) return;

    // Apply theme
    if (settingsData.theme) {
      applyThemeSettings(settingsData.theme);
    }

    // Apply language
    if (settingsData.language) {
      applyLanguageSettings(settingsData.language);
    }

    // Apply appearance
    if (settingsData.appearance) {
      applyAppearanceSettings(settingsData.appearance);
    }

    // Apply accessibility
    if (settingsData.accessibility) {
      applyAccessibilitySettings(settingsData.accessibility);
    }

    // Store in localStorage for persistence
    localStorage.setItem('appSettings', JSON.stringify(settingsData));
  };

  // Apply theme settings globally
  const applyThemeSettings = (themeSettings) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('dark-mode', 'light-mode', 'high-contrast');
    
    // Apply theme mode
    if (themeSettings.mode === 'dark') {
      root.classList.add('dark-mode');
    } else if (themeSettings.mode === 'light') {
      root.classList.add('light-mode');
    } else {
      // Auto mode - use system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark-mode');
      } else {
        root.classList.add('light-mode');
      }
    }

    // Apply primary color
    if (themeSettings.primaryColor) {
      root.style.setProperty('--primary-color', themeSettings.primaryColor);
    }

    // Apply font size
    if (themeSettings.fontSize) {
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      root.style.setProperty('--base-font-size', fontSizeMap[themeSettings.fontSize] || '16px');
    }

    // Apply font family
    if (themeSettings.fontFamily) {
      root.style.setProperty('--font-family', themeSettings.fontFamily);
    }
  };

  // Apply language settings globally
  const applyLanguageSettings = (languageSettings) => {
    // Set HTML lang attribute
    document.documentElement.lang = languageSettings.locale || languageSettings.appLanguage || 'en';
    
    // Set text direction
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    const isRTL = rtlLanguages.includes(languageSettings.locale || languageSettings.appLanguage);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Store in localStorage for global access
    if (languageSettings.appLanguage) {
      localStorage.setItem('userLanguage', languageSettings.appLanguage);
    }
    if (languageSettings.locale) {
      localStorage.setItem('userLocale', languageSettings.locale);
    }
    if (languageSettings.currency) {
      localStorage.setItem('userCurrency', languageSettings.currency);
    }
    if (languageSettings.timezone) {
      localStorage.setItem('userTimezone', languageSettings.timezone);
    }

    // Dispatch global events for other components
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { 
        language: languageSettings.appLanguage,
        locale: languageSettings.locale 
      }
    }));

    window.dispatchEvent(new CustomEvent('currencyChanged', {
      detail: { currency: languageSettings.currency }
    }));

    window.dispatchEvent(new CustomEvent('timezoneChanged', {
      detail: { timezone: languageSettings.timezone }
    }));
  };

  // Apply appearance settings globally
  const applyAppearanceSettings = (appearanceSettings) => {
    // Store in localStorage
    localStorage.setItem('appAppearance', JSON.stringify(appearanceSettings));

    // Apply compact mode
    const root = document.documentElement;
    if (appearanceSettings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Apply animations
    if (!appearanceSettings.showAnimations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('appearanceChanged', {
      detail: appearanceSettings
    }));
  };

  // Apply accessibility settings globally
  const applyAccessibilitySettings = (accessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (accessibilitySettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduce motion
    if (accessibilitySettings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Keyboard navigation
    if (accessibilitySettings.keyboardNavigation) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }

    // Store in localStorage
    localStorage.setItem('appAccessibility', JSON.stringify(accessibilitySettings));
  };

  // ✅ FIXED: Update settings with enhanced error handling
  const updateSettings = async (section, data) => {
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const tenantId = getTenantId();

      console.log('🔄 Updating settings:', { section, data, hasToken: !!token });

      // Update local state immediately for instant feedback
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          ...data
        }
      }));

      // Apply the changes globally immediately
      const updatedSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          ...data
        }
      };
      applyGlobalSettings(updatedSettings);

      // If no token or invalid token, just update local state
      if (!token || !validateToken(token)) {
        console.log('👤 No valid token - updating local state only');
        if (!validateToken(token)) {
          clearInvalidTokens();
        }
        return { success: true };
      }

      // ✅ FIXED: Use correct endpoint - PUT /api/settings/update-section
      const response = await fetch('http://localhost:5000/api/settings/update-section', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Tenant-ID': tenantId
        },
        body: JSON.stringify({
          section: section,
          settings: data
        })
      });

      console.log('📡 Update API Response:', response.status);

      if (response.status === 401) {
        console.warn('🔐 Token expired during update - clearing tokens');
        clearInvalidTokens();
        return { 
          success: false, 
          error: 'Session expired. Please log in again.' 
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update settings');
      }

      return { success: true, data: result.data };
    } catch (err) {
      console.error('❌ Error updating settings:', err);
      
      // Revert local state on error
      await loadSettings();
      
      return { 
        success: false, 
        error: err.message 
      };
    }
  };

  // ✅ FIXED: Reset all settings to default
  const resetSettings = async () => {
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const tenantId = getTenantId();
      
      if (!token || !validateToken(token)) {
        if (!validateToken(token)) {
          clearInvalidTokens();
        }
        const defaultSettings = getDefaultSettings();
        setSettings(defaultSettings);
        applyGlobalSettings(defaultSettings);
        return { success: true };
      }

      // ✅ FIXED: Use correct endpoint
      const response = await fetch('http://localhost:5000/api/settings/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Tenant-ID': tenantId
        }
      });

      if (response.status === 401) {
        console.warn('🔐 Token expired during reset - clearing tokens');
        clearInvalidTokens();
        return { 
          success: false, 
          error: 'Session expired. Please log in again.' 
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to reset settings: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await loadSettings(); // Reload settings
      }

      return result;
    } catch (err) {
      console.error('Error resetting settings:', err);
      return { 
        success: false, 
        error: err.message 
      };
    }
  };

  // Initialize settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      if (settings?.theme?.mode === 'auto') {
        const root = document.documentElement;
        root.classList.remove('dark-mode', 'light-mode');
        if (e.matches) {
          root.classList.add('dark-mode');
        } else {
          root.classList.add('light-mode');
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [settings?.theme?.mode]);

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    reloadSettings: loadSettings,
    getTenantId
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;