//src/pages/settings.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { settings, updateSettings, resetSettings, loading, error } = useSettings();
  const { t, language, updateLanguage } = useLanguage();
  const { updateTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState('');
  const [localSettings, setLocalSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorData, setTwoFactorData] = useState({
    step: 'setup', // 'setup', 'verify', 'recovery', 'backup'
    qrCode: '',
    secret: '',
    verificationCode: '',
    recoveryCodes: [],
    backupCode: ''
  });
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [requires2FAVerification, setRequires2FAVerification] = useState(false);

  // ✅ FIXED: Enhanced authentication check with fallback
  const getAuthHeaders = () => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
    const tenantId = getTenantId();
    
    const headers = {
      'Content-Type': 'application/json',
      'Tenant-ID': tenantId,
      'X-Tenant-ID': tenantId
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // ✅ FIXED: Get tenant ID from localStorage or generate one if not exists
  const getTenantId = () => {
    let tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
    
    if (!tenantId) {
      tenantId = 'tenant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tenantId', tenantId);
    }
    
    return tenantId;
  };

  // ✅ FIXED: Enhanced 2FA verification check using backend with error handling
  const check2FAVerificationRequired = async () => {
    try {
      const headers = getAuthHeaders();
      
      // Check if we have authentication before making the request
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      if (!token) {
        console.log('No token available for 2FA verification check');
        return false;
      }
      
      const response = await fetch('http://localhost:5000/api/two-factor/verification-required', {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.verificationRequired || false;
      } else if (response.status === 401) {
        console.log('Session expired during 2FA verification check');
        return false;
      }
      return false;
    } catch (error) {
      console.log('Error checking 2FA verification:', error.message);
      return false;
    }
  };

  // ✅ FIXED: Check authentication status - SILENT version (no console warnings)
  const checkAuthentication = () => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
    return !!token; // Simply return boolean without logging
  };

  // ✅ FIXED: Enhanced authentication check with user feedback
  const requireAuthentication = (action = 'perform this action') => {
    const isAuthenticated = checkAuthentication();
    if (!isAuthenticated) {
      setSaveStatus('❌ ' + (t('authenticationRequired') || 'Please log in to ' + action));
      setTimeout(() => setSaveStatus(''), 5000);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (settings) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
      if (settings.profile?.profilePhoto) {
        setImagePreview(settings.profile.profilePhoto);
      }
    }
  }, [settings]);

  // ✅ FIXED: Check for 2FA verification requirement on component mount
  useEffect(() => {
    const checkVerification = async () => {
      if (localSettings?.privacy?.twoFactorAuth) {
        const requiresVerification = await check2FAVerificationRequired();
        setRequires2FAVerification(requiresVerification);
        if (requiresVerification) {
          setSaveStatus('🛡️ ' + (t('twoFactorVerificationRequired') || 'Two-factor verification required for security'));
          setTimeout(() => setSaveStatus(''), 5000);
        }
      }
    };

    if (localSettings) {
      checkVerification();
    }
  }, [localSettings]);

  const handleSave = async (section) => {
    if (!localSettings || !localSettings[section]) {
      setSaveStatus('❌ ' + (t('noSettingsToSave') || 'No settings to save'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setSaving(true);
    
    const settingsData = {
      ...localSettings[section],
      tenantId: getTenantId()
    };
    
    const result = await updateSettings(section, settingsData);
    setSaving(false);
    
    if (result.success) {
      setSaveStatus('✅ ' + (t('settingsSaved') || 'Settings saved successfully!'));
      
      // Send notification email if notifications are enabled and email notifications are turned on
      if (section === 'notifications' && localSettings.notifications?.email) {
        await sendNotificationEmail('settingsUpdated');
      }
      
      setTimeout(() => setSaveStatus(''), 3000);
    } else {
      setSaveStatus(`❌ ${result.error || (t('saveFailed') || 'Failed to save')}`);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // ✅ FIXED: Send notification email with authentication check
  const sendNotificationEmail = async (type) => {
    try {
      // Check if user is authenticated before sending notification
      if (!checkAuthentication()) {
        console.log('User not authenticated, skipping notification email');
        return;
      }

      const headers = getAuthHeaders();
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName') || 'User';
      
      if (!userEmail) {
        console.log('No user email found for notification');
        return;
      }

      const response = await fetch('http://localhost:5000/api/notifications/send', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          type: type,
          email: userEmail,
          name: userName,
          tenantId: getTenantId()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Notification email sent successfully');
      } else {
        console.log('❌ Failed to send notification email:', data.message);
      }
    } catch (error) {
      console.log('Error sending notification email:', error.message);
    }
  };

  // Enhanced language change handler with immediate global application
  const handleLanguageChange = async (newLanguage) => {
    if (!localSettings || saving) return;
    
    setSaving(true);
    
    try {
      // Update local state immediately for instant UI feedback
      updateLocalSetting('language', 'appLanguage', newLanguage);
      updateLocalSetting('language', 'locale', newLanguage);
      
      // Update language context globally - this will trigger re-render of entire app
      const languageResult = await updateLanguage(newLanguage);
      
      if (languageResult.success) {
        // Prepare updated language settings for backend
        const updatedLanguageSettings = {
          ...localSettings.language,
          appLanguage: newLanguage,
          locale: newLanguage,
          tenantId: getTenantId()
        };
        
        // Save to backend
        const settingsResult = await updateSettings('language', updatedLanguageSettings);
        
        if (settingsResult.success) {
          const languageNames = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'ta': 'Tamil',
            'te': 'Telugu',
            'bn': 'Bengali',
            'pa': 'Punjabi',
            'mr': 'Marathi',
            'tr': 'Turkish',
            'vi': 'Vietnamese',
            'pl': 'Polish',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'no': 'Norwegian',
            'da': 'Danish',
            'fi': 'Finnish',
            'el': 'Greek',
            'he': 'Hebrew',
            'id': 'Indonesian',
            'ms': 'Malay',
            'th': 'Thai',
            'uk': 'Ukrainian',
            'cs': 'Czech',
            'ro': 'Romanian',
            'hu': 'Hungarian'
          };
          
          const languageName = languageNames[newLanguage] || newLanguage;
          setSaveStatus(`✅ ${t('languageChanged') || 'Language changed to'} ${languageName}!`);
        }
      } else {
        setSaveStatus('❌ ' + (t('languageChangeFailed') || 'Failed to change language'));
      }
    } catch (error) {
      console.log('Language change error:', error);
      setSaveStatus('❌ ' + (t('languageChangeError') || 'Error changing language'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Enhanced currency change handler with immediate global application
  const handleCurrencyChange = async (newCurrency) => {
    if (!localSettings || saving) return;
    
    setSaving(true);
    
    try {
      // Update local state immediately
      updateLocalSetting('language', 'currency', newCurrency);
      
      // Prepare updated settings for backend
      const updatedLanguageSettings = {
        ...localSettings.language,
        currency: newCurrency,
        tenantId: getTenantId()
      };
      
      // Save to backend and apply globally
      const result = await updateSettings('language', updatedLanguageSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('currencyChanged') || 'Currency changed to'} ${newCurrency}!`);
        
        // Store currency in localStorage for global access
        localStorage.setItem('userCurrency', newCurrency);
        
        // Dispatch global event for other components
        window.dispatchEvent(new CustomEvent('currencyChanged', {
          detail: { currency: newCurrency }
        }));
      } else {
        setSaveStatus('❌ ' + (t('currencyChangeFailed') || 'Failed to change currency'));
      }
    } catch (error) {
      console.log('Currency change error:', error);
      setSaveStatus('❌ ' + (t('currencyChangeError') || 'Error changing currency'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Enhanced timezone change handler with immediate global application
  const handleTimezoneChange = async (newTimezone) => {
    if (!localSettings || saving) return;
    
    setSaving(true);
    
    try {
      // Update local state immediately
      updateLocalSetting('language', 'timezone', newTimezone);
      
      // Prepare updated settings for backend
      const updatedLanguageSettings = {
        ...localSettings.language,
        timezone: newTimezone,
        tenantId: getTenantId()
      };
      
      // Save to backend and apply globally
      const result = await updateSettings('language', updatedLanguageSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('timezoneChanged') || 'Timezone changed to'} ${newTimezone}!`);
        
        // Store timezone in localStorage for global access
        localStorage.setItem('userTimezone', newTimezone);
        
        // Dispatch global event for other components
        window.dispatchEvent(new CustomEvent('timezoneChanged', {
          detail: { timezone: newTimezone }
        }));
      } else {
        setSaveStatus('❌ ' + (t('timezoneChangeFailed') || 'Failed to change timezone'));
      }
    } catch (error) {
      console.log('Timezone change error:', error);
      setSaveStatus('❌ ' + (t('timezoneChangeError') || 'Error changing timezone'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Enhanced theme change handler with immediate global application
  const handleThemeChange = async (newTheme) => {
    if (!localSettings || saving) return;
    
    setSaving(true);
    
    try {
      // Update local state immediately
      updateLocalSetting('theme', 'mode', newTheme);
      
      // Update theme context globally
      updateTheme(newTheme);
      
      // Prepare updated settings for backend
      const updatedThemeSettings = {
        ...localSettings.theme,
        mode: newTheme,
        tenantId: getTenantId()
      };
      
      // Save to backend
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('themeChanged') || 'Theme changed to'} ${newTheme}!`);
      } else {
        setSaveStatus('❌ ' + (t('themeChangeFailed') || 'Failed to change theme'));
      }
    } catch (error) {
      console.log('Theme change error:', error);
      setSaveStatus('❌ ' + (t('themeChangeError') || 'Error changing theme'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSaveStatus('❌ ' + (t('imageSizeError') || 'Image size should be less than 5MB'));
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        updateLocalSetting('profile', 'profilePhoto', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ FIXED: Password change with authentication check
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveStatus('❌ ' + (t('passwordsNotMatch') || 'Passwords do not match'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setSaveStatus('❌ ' + (t('passwordMinLength') || 'Password must be at least 6 characters'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    // Check authentication before proceeding
    if (!requireAuthentication('change your password')) {
      return;
    }

    setSaving(true);
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/settings/change-password', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          tenantId: getTenantId()
        })
      });

      const data = await response.json();
      setSaving(false);

      if (data.success) {
        setSaveStatus('✅ ' + (t('passwordChanged') || 'Password changed successfully!'));
        
        // Send notification email if email notifications are enabled
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('passwordChanged');
        }
        
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus(`❌ ${data.message}`);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      setSaving(false);
      setSaveStatus('❌ ' + (t('passwordChangeError') || 'Error changing password'));
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ FIXED: WhatsApp-style Two-Factor Authentication Handlers with improved authentication check
  const handleTwoFactorAuth = async (enable) => {
    // Check authentication before proceeding with 2FA operations
    if (!requireAuthentication('enable two-factor authentication')) {
      // Reset the checkbox state if authentication fails
      updateLocalSetting('privacy', 'twoFactorAuth', !enable);
      return;
    }

    if (!enable) {
      // Disable 2FA
      setTwoFactorLoading(true);
      try {
        const headers = getAuthHeaders();
        
        const response = await fetch('http://localhost:5000/api/two-factor/disable', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            tenantId: getTenantId()
          })
        });

        const data = await response.json();
        
        if (data.success) {
          updateLocalSetting('privacy', 'twoFactorAuth', false);
          setSaveStatus('✅ ' + (t('twoFactorDisabled') || 'Two-factor authentication disabled!'));
          
          // Send notification email if email notifications are enabled
          if (localSettings.notifications?.email) {
            await sendNotificationEmail('twoFactorDisabled');
          }
        } else {
          setSaveStatus('❌ ' + (data.message || t('twoFactorDisableFailed') || 'Failed to disable two-factor authentication'));
          // Reset checkbox on failure
          updateLocalSetting('privacy', 'twoFactorAuth', true);
        }
      } catch (error) {
        console.log('2FA disable error:', error);
        setSaveStatus('❌ ' + (t('twoFactorDisableError') || 'Error disabling two-factor authentication'));
        // Reset checkbox on error
        updateLocalSetting('privacy', 'twoFactorAuth', true);
      } finally {
        setTwoFactorLoading(false);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } else {
      // Enable 2FA - show setup modal
      setShowTwoFactorModal(true);
      setTwoFactorData({
        step: 'setup',
        qrCode: '',
        secret: '',
        verificationCode: '',
        recoveryCodes: [],
        backupCode: ''
      });
      initializeTwoFactorSetup();
    }
  };

  // ✅ FIXED: Initialize 2FA setup with proper authentication handling
  const initializeTwoFactorSetup = async () => {
    setTwoFactorLoading(true);
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/two-factor/setup', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          tenantId: getTenantId()
        })
      });

      // Check if response is unauthorized
      if (response.status === 401) {
        setSaveStatus('❌ ' + (t('sessionExpired') || 'Your session has expired. Please log in again.'));
        setShowTwoFactorModal(false);
        setTwoFactorLoading(false);
        
        // Reset 2FA toggle
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        
        // Clear invalid tokens
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorData(prev => ({
          ...prev,
          qrCode: data.qrCode,
          secret: data.secret,
          recoveryCodes: data.backupCodes || []
        }));
      } else {
        setSaveStatus('❌ ' + (data.message || t('twoFactorSetupFailed') || 'Failed to setup two-factor authentication'));
        setTimeout(() => setSaveStatus(''), 3000);
        setShowTwoFactorModal(false);
        // Reset 2FA toggle on failure
        updateLocalSetting('privacy', 'twoFactorAuth', false);
      }
    } catch (error) {
      console.log('2FA setup error:', error);
      if (error.message.includes('Authentication required') || error.message.includes('401')) {
        setSaveStatus('❌ ' + (t('sessionExpired') || 'Your session has expired. Please log in again.'));
        // Reset 2FA toggle
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        // Clear invalid tokens
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
      } else {
        setSaveStatus('❌ ' + (t('twoFactorSetupError') || 'Error setting up two-factor authentication'));
        // Reset 2FA toggle on error
        updateLocalSetting('privacy', 'twoFactorAuth', false);
      }
      setTimeout(() => setSaveStatus(''), 3000);
      setShowTwoFactorModal(false);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // ✅ FIXED: Verify 2FA code with proper authentication handling
  const verifyTwoFactorCode = async () => {
    if (!twoFactorData.verificationCode || twoFactorData.verificationCode.length !== 6) {
      setSaveStatus('❌ ' + (t('invalidVerificationCode') || 'Please enter a valid 6-digit code'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setTwoFactorLoading(true);
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/two-factor/verify', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          tenantId: getTenantId(),
          code: twoFactorData.verificationCode,
          secret: twoFactorData.secret
        })
      });

      if (response.status === 401) {
        setSaveStatus('❌ ' + (t('sessionExpired') || 'Your session has expired. Please log in again.'));
        setTwoFactorLoading(false);
        // Reset 2FA toggle
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorData(prev => ({
          ...prev,
          step: 'recovery',
          recoveryCodes: data.recoveryCodes || prev.recoveryCodes
        }));
        // Keep 2FA enabled since verification was successful
        updateLocalSetting('privacy', 'twoFactorAuth', true);
        
        // Send notification email if email notifications are enabled
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('twoFactorEnabled');
        }
      } else {
        setSaveStatus('❌ ' + (data.message || t('invalidVerificationCode') || 'Invalid verification code'));
        // Reset 2FA toggle on verification failure
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.log('2FA verification error:', error);
      if (error.message.includes('Authentication required')) {
        setSaveStatus('❌ ' + (t('sessionExpired') || 'Your session has expired. Please log in again.'));
        // Reset 2FA toggle
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
      } else {
        setSaveStatus('❌ ' + (t('verificationError') || 'Error verifying code'));
        // Reset 2FA toggle on error
        updateLocalSetting('privacy', 'twoFactorAuth', false);
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const completeTwoFactorSetup = () => {
    setShowTwoFactorModal(false);
    setSaveStatus('✅ ' + (t('twoFactorEnabled') || 'Two-factor authentication enabled successfully!'));
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // ✅ FIXED: Backup code verification with proper authentication handling
  const handleBackupCodeVerification = async () => {
    if (!twoFactorData.backupCode) {
      setSaveStatus('❌ ' + (t('enterBackupCode') || 'Please enter a backup code'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setTwoFactorLoading(true);
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/two-factor/verify-backup', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          tenantId: getTenantId(),
          backupCode: twoFactorData.backupCode
        })
      });

      if (response.status === 401) {
        setSaveStatus('❌ ' + (t('sessionExpired') || 'Your session has expired. Please log in again.'));
        setTwoFactorLoading(false);
        // Reset 2FA toggle
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorData(prev => ({
          ...prev,
          step: 'recovery',
          recoveryCodes: data.newRecoveryCodes || prev.recoveryCodes
        }));
        // Keep 2FA enabled since verification was successful
        updateLocalSetting('privacy', 'twoFactorAuth', true);
        
        // Send notification email if email notifications are enabled
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('twoFactorEnabled');
        }
      } else {
        setSaveStatus('❌ ' + (data.message || t('invalidBackupCode') || 'Invalid backup code'));
        // Reset 2FA toggle on verification failure
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.log('Backup code verification error:', error);
      if (error.message.includes('Authentication required')) {
        setSaveStatus('❌ ' + (t('sessionExpired') || 'Your session has expired. Please log in again.'));
        // Reset 2FA toggle
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
      } else {
        setSaveStatus('❌ ' + (t('backupCodeError') || 'Error verifying backup code'));
        // Reset 2FA toggle on error
        updateLocalSetting('privacy', 'twoFactorAuth', false);
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // ✅ FIXED: WhatsApp-style periodic verification handler
  const handlePeriodicVerification = async () => {
    // This will trigger the AppWrapper to show the verification popup
    window.location.reload();
  };

  // ✅ FIXED: Signout with proper cleanup
  const handleSignout = async () => {
    try {
      setSaving(true);
      
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      const tenantId = getTenantId();
      
      if (token) {
        try {
          const headers = getAuthHeaders();
          const response = await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: headers,
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
      }
      
      // Clear all authentication and user data
      const itemsToRemove = [
        'sessionToken',
        'token',
        'authToken',
        'userEmail',
        'userId',
        'userName',
        'refreshToken',
        'isLoggedIn',
        'last2FAVerification',
        'userCurrency',
        'userTimezone'
      ];
      
      itemsToRemove.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      });
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      setSaving(false);
      setShowSignoutModal(false);
      
      setSaveStatus('✅ ' + (t('signedOut') || 'Successfully signed out!'));
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
    } catch (error) {
      console.log('Signout error:', error);
      setSaving(false);
      setSaveStatus('❌ ' + (t('signoutError') || 'Error during signout'));
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const updateLocalSetting = (section, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleReset = async () => {
    if (window.confirm('⚠️ ' + (t('resetConfirm') || 'Are you sure you want to reset all settings to default? This cannot be undone.'))) {
      setSaving(true);
      const result = await resetSettings(getTenantId());
      setSaving(false);
      
      if (result.success) {
        setSaveStatus('✅ ' + (t('settingsReset') || 'Settings reset successfully!'));
        
        // Send notification email if email notifications are enabled
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('settingsReset');
        }
        
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ ' + (t('resetError') || 'Error resetting settings'));
        setTimeout(() => setSaveStatus(''), 3000);
      }
    }
  };

  // ✅ FIXED: Export data with authentication check
  const handleExport = async () => {
    // Check authentication before proceeding
    if (!requireAuthentication('export your data')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/settings/export-data', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          tenantId: getTenantId()
        })
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finovo-settings-${getTenantId()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSaveStatus('✅ ' + (t('dataExported') || 'Data exported successfully!'));
      
      // Send notification email if email notifications are enabled
      if (localSettings.notifications?.email) {
        await sendNotificationEmail('dataExported');
      }
      
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.log('Export error:', error);
      setSaveStatus('❌ ' + (t('exportError') || 'Error exporting data'));
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const displayTenantInfo = () => {
    const tenantId = getTenantId();
    return (
      <div className="about-item">
        <strong>{t('tenantId') || 'Tenant ID'}:</strong>
        <span title={tenantId}>{tenantId.substring(0, 15)}...</span>
      </div>
    );
  };

  if (loading || !localSettings) {
    return (
      <div className="settings-loading">
        <div className="loader-spinner"></div>
        <p>{t('loadingSettings') || 'Loading your settings...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-error">
        <div className="error-icon">⚠️</div>
        <h2>{t('loadSettingsFailed') || 'Failed to Load Settings'}</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-save">
          {t('reloadPage') || 'Reload Page'}
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('profile') || 'Profile', icon: '👤' },
    { id: 'account', label: t('account') || 'Account', icon: '🏢' },
    { id: 'theme', label: t('theme') || 'Theme', icon: '🎨' },
    { id: 'notifications', label: t('notifications') || 'Notifications', icon: '🔔' },
    { id: 'privacy', label: t('privacy') || 'Privacy', icon: '🔒' },
    { id: 'appearance', label: t('appearance') || 'Appearance', icon: '✨' },
    { id: 'language', label: t('language') || 'Language & Region', icon: '🌍' },
    { id: 'performance', label: t('performance') || 'Performance', icon: '⚡' },
    { id: 'accessibility', label: t('accessibility') || 'Accessibility', icon: '♿' },
    { id: 'about', label: t('about') || 'About', icon: 'ℹ️' }
  ];

  const userEmail = localStorage.getItem('userEmail') || localSettings.profile?.email || 'user@example.com';

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1>⚙️ {t('settings') || 'Settings'}</h1>
          <p className="settings-subtitle">{t('settingsDescription') || 'Manage your account preferences and app behavior'}</p>
        </div>
        <div className="header-actions">
          {saveStatus && (
            <div className={`save-status ${saveStatus.includes('❌') ? 'error' : ''}`}>
              {saveStatus}
            </div>
          )}
          
          {/* WhatsApp-style 2FA Verification Prompt */}
          {requires2FAVerification && (
            <button 
              className="btn-verify-2fa"
              onClick={handlePeriodicVerification}
              title={t('verifyTwoFactor') || 'Verify two-factor authentication'}
            >
              🛡️ {t('verifySecurity') || 'Verify Security'}
            </button>
          )}
          
          <button 
            className="btn-signout"
            onClick={() => setShowSignoutModal(true)}
            disabled={saving}
            title={t('signOut') || 'Sign out from your account'}
          >
            🚪 {t('signOut') || 'Sign Out'}
          </button>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={saving}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>👤 {t('profileSettings') || 'Profile Settings'}</h2>
              <p className="section-description">{t('updateProfilePicture') || 'Update your profile picture and view your information'}</p>
              
              <div className="profile-header-section">
                <div className="profile-image-container">
                  <div className="profile-image-wrapper">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="profile-image" />
                    ) : (
                      <div className="profile-image-placeholder">
                        <span className="profile-initials">
                          {(localSettings.profile?.name || userEmail).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <label htmlFor="profile-image-input" className="profile-image-edit">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </label>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      disabled={saving}
                    />
                  </div>
                  <div className="profile-image-info">
                    <h3>{localSettings.profile?.name || t('user') || 'User'}</h3>
                    <p className="profile-email">{userEmail}</p>
                    <small>{t('clickToUpload') || 'Click on the camera icon to upload a new photo'}</small>
                  </div>
                </div>
              </div>
              
              <div className="setting-group">
                <label>{t('displayName') || 'Display Name'}</label>
                <input
                  type="text"
                  value={localSettings.profile?.name || ''}
                  onChange={(e) => updateLocalSetting('profile', 'name', e.target.value)}
                  placeholder={t('enterDisplayName') || "Enter your display name"}
                  disabled={saving}
                />
              </div>
              
              <div className="setting-group">
                <label>{t('emailAddress') || 'Email Address'} ({t('readOnly') || 'Read Only'})</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="readonly-input"
                />
                <small>{t('emailCannotChange') || 'Email cannot be changed here. Contact support to update.'}</small>
              </div>
              
              <div className="setting-group">
                <label>{t('phoneNumber') || 'Phone Number'}</label>
                <input
                  type="tel"
                  value={localSettings.profile?.phone || ''}
                  onChange={(e) => updateLocalSetting('profile', 'phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={saving}
                />
              </div>
              
              <div className="setting-group">
                <label>{t('bio') || 'Bio'}</label>
                <textarea
                  value={localSettings.profile?.bio || ''}
                  onChange={(e) => updateLocalSetting('profile', 'bio', e.target.value)}
                  placeholder={t('tellAboutYourself') || "Tell us about yourself..."}
                  rows="4"
                  disabled={saving}
                />
              </div>
              
              <button className="btn-save" onClick={() => handleSave('profile')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveProfile') || 'Save Profile')}
              </button>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>🏢 {t('accountType') || 'Account Type'}</h2>
              <p className="section-description">{t('chooseAccountType') || 'Choose your account type based on your needs'}</p>
              
              <div className="account-type-cards">
                <div 
                  className={`account-card ${localSettings.account?.type === 'individual' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'individual')}
                >
                  <div className="account-card-icon">👤</div>
                  <h3>{t('individual') || 'Individual'}</h3>
                  <p>{t('individualDescription') || 'Perfect for personal finance management'}</p>
                  <ul>
                    <li>{t('singleUserAccess') || 'Single user access'}</li>
                    <li>{t('personalBudgeting') || 'Personal budgeting tools'}</li>
                    <li>{t('transactionTracking') || 'Transaction tracking'}</li>
                    <li>{t('basicReports') || 'Basic reports'}</li>
                  </ul>
                </div>

                <div 
                  className={`account-card ${localSettings.account?.type === 'family' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'family')}
                >
                  <div className="account-card-icon">👨‍👩‍👧‍👦</div>
                  <h3>{t('family') || 'Family'}</h3>
                  <p>{t('familyDescription') || 'Share finances with family members'}</p>
                  <ul>
                    <li>{t('upTo5Members') || 'Up to 5 family members'}</li>
                    <li>{t('sharedBudgets') || 'Shared budgets'}</li>
                    <li>{t('individualProfiles') || 'Individual profiles'}</li>
                    <li>{t('familyReports') || 'Family reports'}</li>
                  </ul>
                </div>

                <div 
                  className={`account-card ${localSettings.account?.type === 'business' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'business')}
                >
                  <div className="account-card-icon">💼</div>
                  <h3>{t('business') || 'Business'}</h3>
                  <p>{t('businessDescription') || 'Advanced tools for business management'}</p>
                  <ul>
                    <li>{t('unlimitedUsers') || 'Unlimited users'}</li>
                    <li>{t('businessAnalytics') || 'Business analytics'}</li>
                    <li>{t('invoiceManagement') || 'Invoice management'}</li>
                    <li>{t('advancedReporting') || 'Advanced reporting'}</li>
                  </ul>
                </div>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('account')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveAccountType') || 'Save Account Type')}
              </button>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="settings-section">
              <h2>🎨 {t('themeSettings') || 'Theme Settings'}</h2>
              <p className="section-description">{t('customizeAppearance') || 'Customize your app appearance'}</p>
              
              <div className="setting-group">
                <label>{t('themeMode') || 'Theme Mode'}</label>
                <select
                  value={localSettings.theme?.mode}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="light">☀️ {t('lightMode') || 'Light Mode'}</option>
                  <option value="dark">🌙 {t('darkMode') || 'Dark Mode'}</option>
                  <option value="auto">🔄 {t('autoSystem') || 'Auto (System)'}</option>
                </select>
                <small>{t('themeChangesImmediate') || 'Theme changes will be applied immediately across the entire app'}</small>
              </div>
              
              <div className="setting-group">
                <label>{t('primaryColor') || 'Primary Color'}</label>
                <div className="color-picker-group">
                  <input
                    type="color"
                    value={localSettings.theme?.primaryColor}
                    onChange={(e) => updateLocalSetting('theme', 'primaryColor', e.target.value)}
                    disabled={saving}
                  />
                  <input
                    type="text"
                    value={localSettings.theme?.primaryColor}
                    onChange={(e) => updateLocalSetting('theme', 'primaryColor', e.target.value)}
                    placeholder="#3b82f6"
                    disabled={saving}
                  />
                </div>
              </div>
              
              <div className="setting-group">
                <label>{t('fontSize') || 'Font Size'}</label>
                <select
                  value={localSettings.theme?.fontSize}
                  onChange={(e) => updateLocalSetting('theme', 'fontSize', e.target.value)}
                  disabled={saving}
                >
                  <option value="small">{t('small') || 'Small'} (14px)</option>
                  <option value="medium">{t('medium') || 'Medium'} (16px)</option>
                  <option value="large">{t('large') || 'Large'} (18px)</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>{t('fontFamily') || 'Font Family'}</label>
                <select
                  value={localSettings.theme?.fontFamily}
                  onChange={(e) => updateLocalSetting('theme', 'fontFamily', e.target.value)}
                  disabled={saving}
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('theme')} disabled={saving}>
                {saving ? (t('applying') || 'Applying...') : '💾 ' + (t('saveTheme') || 'Save Theme')}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>🔔 {t('notificationSettings') || 'Notification Settings'}</h2>
              <p className="section-description">{t('controlNotifications') || 'Control how you receive notifications'}</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">📧 {t('emailNotifications') || 'Email Notifications'}</span>
                    <small>{t('receiveEmailUpdates') || 'Receive updates via email'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.email}
                    onChange={(e) => updateLocalSetting('notifications', 'email', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">🔔 {t('pushNotifications') || 'Push Notifications'}</span>
                    <small>{t('realtimeAlerts') || 'Get real-time alerts'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.push}
                    onChange={(e) => updateLocalSetting('notifications', 'push', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">💰 {t('transactionAlerts') || 'Transaction Alerts'}</span>
                    <small>{t('notifyNewTransactions') || 'Notify on new transactions'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.transactionAlerts}
                    onChange={(e) => updateLocalSetting('notifications', 'transactionAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">📊 {t('weeklyReports') || 'Weekly Reports'}</span>
                    <small>{t('receiveWeeklySummaries') || 'Receive weekly financial summaries'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.weeklyReports}
                    onChange={(e) => updateLocalSetting('notifications', 'weeklyReports', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">💵 {t('budgetAlerts') || 'Budget Alerts'}</span>
                    <small>{t('warnBudgetLimits') || 'Warn when nearing budget limits'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.budgetAlerts}
                    onChange={(e) => updateLocalSetting('notifications', 'budgetAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">🔐 {t('securityAlerts') || 'Security Alerts'}</span>
                    <small>{t('importantSecurityNotifications') || 'Important security notifications'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.securityAlerts}
                    onChange={(e) => updateLocalSetting('notifications', 'securityAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('notifications')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveNotifications') || 'Save Notifications')}
              </button>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>🔒 {t('privacySecurity') || 'Privacy & Security'}</h2>
              <p className="section-description">{t('managePrivacySecurity') || 'Manage your privacy and security preferences'}</p>
              
              <div className="setting-group">
                <label>{t('profileVisibility') || 'Profile Visibility'}</label>
                <select
                  value={localSettings.privacy?.profileVisibility}
                  onChange={(e) => updateLocalSetting('privacy', 'profileVisibility', e.target.value)}
                  disabled={saving}
                >
                  <option value="public">🌐 {t('public') || 'Public'}</option>
                  <option value="private">🔒 {t('private') || 'Private'}</option>
                  <option value="friends">👥 {t('friendsOnly') || 'Friends Only'}</option>
                </select>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('showEmail') || 'Show Email'}</span>
                    <small>{t('displayEmailOnProfile') || 'Display email on profile'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.privacy?.showEmail}
                    onChange={(e) => updateLocalSetting('privacy', 'showEmail', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              {/* WhatsApp-style Two-Factor Authentication Section */}
              <div className="two-factor-section">
                <div className="setting-group toggle-group">
                  <label>
                    <div>
                      <span className="toggle-label">{t('twoFactorAuth') || 'Two-Factor Authentication'}</span>
                      <small>
                        {localSettings.privacy?.twoFactorAuth 
                          ? (t('twoFactorEnabledDescription') || 'Extra security enabled. Verification required every 15 days like WhatsApp.')
                          : (t('twoFactorDisabledDescription') || 'Add extra security to your account. When enabled, verification required every 15 days.')
                        }
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.privacy?.twoFactorAuth || false}
                      onChange={(e) => handleTwoFactorAuth(e.target.checked)}
                      disabled={saving || twoFactorLoading}
                    />
                  </label>
                </div>
                
                {localSettings.privacy?.twoFactorAuth && (
                  <div className="two-factor-status">
                    <div className="status-badge enabled">
                      <span className="status-icon">🛡️</span>
                      <span className="status-text">
                        {t('twoFactorActive') || 'Two-factor authentication is active'}
                        {requires2FAVerification && (
                          <span className="verification-required"> • {t('verificationRequired') || 'Verification Required'}</span>
                        )}
                      </span>
                    </div>
                    <div className="two-factor-actions">
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => handleTwoFactorAuth(false)}
                        disabled={saving || twoFactorLoading}
                      >
                        {twoFactorLoading ? (t('disabling') || 'Disabling...') : (t('disable2FA') || 'Disable 2FA')}
                      </button>
                      {requires2FAVerification && (
                        <button 
                          className="btn-verify btn-sm"
                          onClick={handlePeriodicVerification}
                          disabled={saving}
                        >
                          {t('verifyNow') || 'Verify Now'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('loginAlerts') || 'Login Alerts'}</span>
                    <small>{t('notifyLoginAttempts') || 'Notify on new login attempts'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.privacy?.loginAlerts}
                    onChange={(e) => updateLocalSetting('privacy', 'loginAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="password-change-section">
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowPasswordModal(true)}
                  disabled={saving}
                >
                  🔑 {t('changePassword') || 'Change Password'}
                </button>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('privacy')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('savePrivacy') || 'Save Privacy')}
              </button>
            </div>
          )}

          {/* Other tabs remain the same... */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>✨ {t('appearanceSettings') || 'Appearance Settings'}</h2>
              <p className="section-description">{t('customizeAppLook') || 'Customize how the app looks'}</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('compactMode') || 'Compact Mode'}</span>
                    <small>{t('reduceSpacing') || 'Reduce spacing for more content'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.appearance?.compactMode}
                    onChange={(e) => updateLocalSetting('appearance', 'compactMode', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('showAnimations') || 'Show Animations'}</span>
                    <small>{t('enableSmoothTransitions') || 'Enable smooth transitions'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.appearance?.showAnimations}
                    onChange={(e) => updateLocalSetting('appearance', 'showAnimations', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group">
                <label>{t('currencySymbol') || 'Currency Symbol'}</label>
                <select
                  value={localSettings.appearance?.currencySymbol}
                  onChange={(e) => updateLocalSetting('appearance', 'currencySymbol', e.target.value)}
                  disabled={saving}
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="¥">¥ (JPY)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="₣">₣ (CHF)</option>
                  <option value="₽">₽ (RUB)</option>
                  <option value="R$">R$ (BRL)</option>
                  <option value="₩">₩ (KRW)</option>
                  <option value="A$">A$ (AUD)</option>
                  <option value="C$">C$ (CAD)</option>
                  <option value="HK$">HK$ (HKD)</option>
                  <option value="S$">S$ (SGD)</option>
                  <option value="zł">zł (PLN)</option>
                  <option value="kr">kr (SEK)</option>
                  <option value="Mex$">Mex$ (MXN)</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>{t('dateFormat') || 'Date Format'}</label>
                <select
                  value={localSettings.appearance?.dateFormat}
                  onChange={(e) => updateLocalSetting('appearance', 'dateFormat', e.target.value)}
                  disabled={saving}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('appearance')} disabled={saving}>
                {saving ? (t('applying') || 'Applying...') : '💾 ' + (t('saveAppearance') || 'Save Appearance')}
              </button>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="settings-section">
              <h2>🌍 {t('languageRegion') || 'Language & Region'}</h2>
              <p className="section-description">{t('setLanguagePreferences') || 'Set your language and regional preferences'}</p>
              
              <div className="setting-group">
                <label>{t('language') || 'Language'}</label>
                <select
                  value={localSettings.language?.appLanguage || localSettings.language?.locale || language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español (Spanish)</option>
                  <option value="fr">🇫🇷 Français (French)</option>
                  <option value="de">🇩🇪 Deutsch (German)</option>
                  <option value="it">🇮🇹 Italiano (Italian)</option>
                  <option value="pt">🇵🇹 Português (Portuguese)</option>
                  <option value="ru">🇷🇺 Русский (Russian)</option>
                  <option value="zh">🇨🇳 中文 (Chinese)</option>
                  <option value="ja">🇯🇵 日本語 (Japanese)</option>
                  <option value="ko">🇰🇷 한국어 (Korean)</option>
                  <option value="ar">🇸🇦 العربية (Arabic)</option>
                  <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                  <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
                  <option value="te">🇮🇳 తెలుగు (Telugu)</option>
                  <option value="bn">🇧🇩 বাংলা (Bengali)</option>
                  <option value="pa">🇮🇳 ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="mr">🇮🇳 मराठी (Marathi)</option>
                  <option value="tr">🇹🇷 Türkçe (Turkish)</option>
                  <option value="vi">🇻🇳 Tiếng Việt (Vietnamese)</option>
                  <option value="pl">🇵🇱 Polski (Polish)</option>
                  <option value="nl">🇳🇱 Nederlands (Dutch)</option>
                  <option value="sv">🇸🇪 Svenska (Swedish)</option>
                  <option value="no">🇳🇴 Norsk (Norwegian)</option>
                  <option value="da">🇩🇰 Dansk (Danish)</option>
                  <option value="fi">🇫🇮 Suomi (Finnish)</option>
                  <option value="el">🇬🇷 Ελληνικά (Greek)</option>
                  <option value="he">🇮🇱 עברית (Hebrew)</option>
                  <option value="id">🇮🇩 Bahasa Indonesia (Indonesian)</option>
                  <option value="ms">🇲🇾 Bahasa Melayu (Malay)</option>
                  <option value="th">🇹🇭 ไทย (Thai)</option>
                  <option value="uk">🇺🇦 Українська (Ukrainian)</option>
                  <option value="cs">🇨🇿 Čeština (Czech)</option>
                  <option value="ro">🇷🇴 Română (Romanian)</option>
                  <option value="hu">🇭🇺 Magyar (Hungarian)</option>
                </select>
                <small>{t('languageChangesImmediate') || 'Language changes will be applied immediately across the entire app'}</small>
              </div>

              <div className="setting-group">
                <label>{t('currency') || 'Currency'}</label>
                <select
                  value={localSettings.language?.currency || 'USD'}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="USD">🇺🇸 US Dollar (USD)</option>
                  <option value="EUR">🇪🇺 Euro (EUR)</option>
                  <option value="GBP">🇬🇧 British Pound (GBP)</option>
                  <option value="JPY">🇯🇵 Japanese Yen (JPY)</option>
                  <option value="INR">🇮🇳 Indian Rupee (INR)</option>
                  <option value="CHF">🇨🇭 Swiss Franc (CHF)</option>
                  <option value="RUB">🇷🇺 Russian Ruble (RUB)</option>
                  <option value="BRL">🇧🇷 Brazilian Real (BRL)</option>
                  <option value="KRW">🇰🇷 South Korean Won (KRW)</option>
                  <option value="AUD">🇦🇺 Australian Dollar (AUD)</option>
                  <option value="CAD">🇨🇦 Canadian Dollar (CAD)</option>
                  <option value="HKD">🇭🇰 Hong Kong Dollar (HKD)</option>
                  <option value="SGD">🇸🇬 Singapore Dollar (SGD)</option>
                  <option value="SEK">🇸🇪 Swedish Krona (SEK)</option>
                  <option value="NOK">🇳🇴 Norwegian Krone (NOK)</option>
                  <option value="MXN">🇲🇽 Mexican Peso (MXN)</option>
                  <option value="PLN">🇵🇱 Polish Zloty (PLN)</option>
                  <option value="CNY">🇨🇳 Chinese Yuan (CNY)</option>
                  <option value="AED">🇦🇪 UAE Dirham (AED)</option>
                  <option value="SAR">🇸🇦 Saudi Riyal (SAR)</option>
                  <option value="ZAR">🇿🇦 South African Rand (ZAR)</option>
                  <option value="TRY">🇹🇷 Turkish Lira (TRY)</option>
                  <option value="NZD">🇳🇿 New Zealand Dollar (NZD)</option>
                  <option value="THB">🇹🇭 Thai Baht (THB)</option>
                  <option value="IDR">🇮🇩 Indonesian Rupiah (IDR)</option>
                  <option value="MYR">🇲🇾 Malaysian Ringgit (MYR)</option>
                  <option value="PHP">🇵🇭 Philippine Peso (PHP)</option>
                  <option value="DKK">🇩🇰 Danish Krone (DKK)</option>
                  <option value="CZK">🇨🇿 Czech Koruna (CZK)</option>
                  <option value="HUF">🇭🇺 Hungarian Forint (HUF)</option>
                </select>
                <small>{t('currencyChangesImmediate') || 'Currency changes will be applied immediately across the entire app'}</small>
              </div>
              
              <div className="setting-group">
                <label>{t('timezone') || 'Timezone'}</label>
                <select
                  value={localSettings.language?.timezone || 'UTC'}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Europe/Moscow">Moscow (MSK)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Shanghai">China (CST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Seoul">Seoul (KST)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                  <option value="Pacific/Auckland">Auckland (NZDT)</option>
                </select>
                <small>{t('timezoneChangesImmediate') || 'Timezone changes will be applied immediately across the entire app'}</small>
              </div>
              
              <div className="language-preview">
                <h4>{t('languagePreview') || 'Language Preview'}:</h4>
                <div className="preview-content">
                  <p>{t('currentLanguage') || 'Current language'}: <strong>{localSettings.language?.appLanguage || language}</strong></p>
                  <p>HTML lang attribute: <code>{document.documentElement.lang}</code></p>
                  <p>{t('textDirection') || 'Text direction'}: <code>{document.documentElement.dir}</code></p>
                  <p>{t('currentCurrency') || 'Current currency'}: <strong>{localSettings.language?.currency || 'USD'}</strong></p>
                  <p>{t('currentTimezone') || 'Current timezone'}: <strong>{localSettings.language?.timezone || 'UTC'}</strong></p>
                </div>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('language')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveLanguage') || 'Save Language')}
              </button>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="settings-section">
              <h2>⚡ {t('performanceSettings') || 'Performance Settings'}</h2>
              <p className="section-description">{t('optimizeAppPerformance') || 'Optimize app performance'}</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('enableCache') || 'Enable Cache'}</span>
                    <small>{t('fasterLoadTimes') || 'Faster load times'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.enableCache}
                    onChange={(e) => updateLocalSetting('performance', 'enableCache', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('autoSave') || 'Auto Save'}</span>
                    <small>{t('automaticallySaveChanges') || 'Automatically save changes'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.autoSave}
                    onChange={(e) => updateLocalSetting('performance', 'autoSave', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('lowDataMode') || 'Low Data Mode'}</span>
                    <small>{t('reduceDataUsage') || 'Reduce data usage'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.lowDataMode}
                    onChange={(e) => updateLocalSetting('performance', 'lowDataMode', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('performance')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('savePerformance') || 'Save Performance')}
              </button>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="settings-section">
              <h2>♿ {t('accessibilitySettings') || 'Accessibility Settings'}</h2>
              <p className="section-description">{t('makeAppEasierToUse') || 'Make the app easier to use'}</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('highContrast') || 'High Contrast'}</span>
                    <small>{t('betterVisibility') || 'Better visibility'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.highContrast}
                    onChange={(e) => updateLocalSetting('accessibility', 'highContrast', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('reduceMotion') || 'Reduce Motion'}</span>
                    <small>{t('minimizeAnimations') || 'Minimize animations'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.reduceMotion}
                    onChange={(e) => updateLocalSetting('accessibility', 'reduceMotion', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('screenReaderSupport') || 'Screen Reader Support'}</span>
                    <small>{t('optimizeScreenReaders') || 'Optimize for screen readers'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.screenReader}
                    onChange={(e) => updateLocalSetting('accessibility', 'screenReader', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('keyboardNavigation') || 'Keyboard Navigation'}</span>
                    <small>{t('enhancedKeyboardSupport') || 'Enhanced keyboard support'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.keyboardNavigation}
                    onChange={(e) => updateLocalSetting('accessibility', 'keyboardNavigation', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('accessibility')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveAccessibility') || 'Save Accessibility')}
              </button>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="settings-section">
              <h2>ℹ️ {t('aboutFinovo') || 'About Finovo'}</h2>
              <p className="section-description">{t('appInformation') || 'App information and data management'}</p>
              
              <div className="about-content">
                {displayTenantInfo()}
                <div className="about-item">
                  <strong>{t('version') || 'Version'}:</strong>
                  <span>3.2.0</span>
                </div>
                <div className="about-item">
                  <strong>{t('lastUpdated') || 'Last Updated'}:</strong>
                  <span>November 2024</span>
                </div>
                <div className="about-item">
                  <strong>{t('license') || 'License'}:</strong>
                  <span>MIT License</span>
                </div>
                <div className="about-item">
                  <strong>{t('support') || 'Support'}:</strong>
                  <span>support@finovo.app</span>
                </div>
                
                <div className="about-actions">
                  <button className="btn-secondary" onClick={handleExport} disabled={saving}>
                    📥 {t('exportData') || 'Export Data'}
                  </button>
                  <button className="btn-danger" onClick={handleReset} disabled={saving}>
                    🔄 {t('resetSettings') || 'Reset All Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 {t('changePassword') || 'Change Password'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="setting-group">
                <label>{t('currentPassword') || 'Current Password'}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder={t('enterCurrentPassword') || "Enter current password"}
                  disabled={saving}
                />
              </div>
              <div className="setting-group">
                <label>{t('newPassword') || 'New Password'}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder={t('enterNewPassword') || "Enter new password (min 6 characters)"}
                  disabled={saving}
                />
              </div>
              <div className="setting-group">
                <label>{t('confirmPassword') || 'Confirm New Password'}</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder={t('confirmNewPassword') || "Confirm new password"}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowPasswordModal(false)}
                disabled={saving}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button 
                className="btn-save" 
                onClick={handlePasswordChange}
                disabled={saving}
              >
                {saving ? (t('changing') || 'Changing...') : t('changePassword') || 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Setup Modal */}
      {showTwoFactorModal && (
        <div className="modal-overlay" onClick={() => !twoFactorLoading && setShowTwoFactorModal(false)}>
          <div className="modal-content two-factor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {twoFactorData.step === 'setup' && '🛡️ ' + (t('setupTwoFactor') || 'Setup Two-Factor Authentication')}
                {twoFactorData.step === 'verify' && '🔐 ' + (t('verifyCode') || 'Verify Authentication Code')}
                {twoFactorData.step === 'recovery' && '📋 ' + (t('recoveryCodes') || 'Save Recovery Codes')}
                {twoFactorData.step === 'backup' && '🔑 ' + (t('backupCode') || 'Enter Backup Code')}
              </h3>
              <button 
                className="modal-close"
                onClick={() => !twoFactorLoading && setShowTwoFactorModal(false)}
                disabled={twoFactorLoading}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* Setup Step - QR Code and Secret */}
              {twoFactorData.step === 'setup' && (
                <div className="two-factor-step">
                  <div className="step-description">
                    <p>{t('twoFactorSetupDescription') || 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) to set up two-factor authentication.'}</p>
                    <p className="whatsapp-style-note">💡 <strong>WhatsApp-style security:</strong> You'll only need to verify every 15 days for security.</p>
                  </div>
                  
                  <div className="qr-code-container">
                    {twoFactorData.qrCode ? (
                      <div className="qr-code-wrapper">
                        <img src={twoFactorData.qrCode} alt="QR Code" className="qr-code" />
                      </div>
                    ) : (
                      <div className="qr-code-placeholder">
                        <div className="loader-spinner small"></div>
                        <p>{t('generatingQRCode') || 'Generating QR code...'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="secret-key-container">
                    <label>{t('secretKey') || 'Secret Key'}:</label>
                    <div className="secret-key-display">
                      <code>{twoFactorData.secret || 'Generating...'}</code>
                      <button 
                        className="btn-copy"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFactorData.secret);
                          setSaveStatus('✅ ' + (t('copiedToClipboard') || 'Copied to clipboard!'));
                          setTimeout(() => setSaveStatus(''), 2000);
                        }}
                        disabled={!twoFactorData.secret}
                      >
                        📋
                      </button>
                    </div>
                    <small>{t('secretKeyWarning') || 'Keep this secret key safe. You can use it to set up multiple devices.'}</small>
                  </div>
                  
                  <div className="next-step">
                    <button 
                      className="btn-save"
                      onClick={() => setTwoFactorData(prev => ({...prev, step: 'verify'}))}
                      disabled={!twoFactorData.secret || twoFactorLoading}
                    >
                      {t('continueToVerification') || 'Continue to Verification'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Verification Step */}
              {twoFactorData.step === 'verify' && (
                <div className="two-factor-step">
                  <div className="step-description">
                    <p>{t('enterVerificationCode') || 'Enter the 6-digit code from your authenticator app to verify setup.'}</p>
                    <p className="whatsapp-style-note">🛡️ <strong>Security Note:</strong> Like WhatsApp, you'll only need to verify every 15 days for added security.</p>
                  </div>
                  
                  <div className="verification-input-container">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="6"
                      placeholder="123456"
                      value={twoFactorData.verificationCode}
                      onChange={(e) => setTwoFactorData(prev => ({
                        ...prev, 
                        verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                      }))}
                      className="verification-code-input"
                      disabled={twoFactorLoading}
                      autoFocus
                    />
                  </div>
                  
                  <div className="backup-option">
                    <button 
                      className="btn-text"
                      onClick={() => setTwoFactorData(prev => ({...prev, step: 'backup'}))}
                      disabled={twoFactorLoading}
                    >
                      {t('lostAccess') || "Can't access authenticator? Use backup method"}
                    </button>
                  </div>
                  
                  <div className="modal-footer">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setTwoFactorData(prev => ({...prev, step: 'setup'}))}
                      disabled={twoFactorLoading}
                    >
                      {t('back') || 'Back'}
                    </button>
                    <button 
                      className="btn-save" 
                      onClick={verifyTwoFactorCode}
                      disabled={twoFactorLoading || twoFactorData.verificationCode.length !== 6}
                    >
                      {twoFactorLoading ? (t('verifying') || 'Verifying...') : t('verifyAndEnable') || 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Backup Code Step */}
              {twoFactorData.step === 'backup' && (
                <div className="two-factor-step">
                  <div className="step-description">
                    <p>{t('enterBackupCodeDescription') || 'Enter one of your backup codes to verify your identity.'}</p>
                  </div>
                  
                  <div className="setting-group">
                    <label>{t('backupCode') || 'Backup Code'}:</label>
                    <input
                      type="text"
                      value={twoFactorData.backupCode}
                      onChange={(e) => setTwoFactorData(prev => ({...prev, backupCode: e.target.value}))}
                      placeholder={t('enterBackupCode') || "Enter 8-digit backup code"}
                      disabled={twoFactorLoading}
                    />
                  </div>
                  
                  <div className="modal-footer">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setTwoFactorData(prev => ({...prev, step: 'verify', backupCode: ''}))}
                      disabled={twoFactorLoading}
                    >
                      {t('back') || 'Back'}
                    </button>
                    <button 
                      className="btn-save" 
                      onClick={handleBackupCodeVerification}
                      disabled={twoFactorLoading || !twoFactorData.backupCode}
                    >
                      {twoFactorLoading ? (t('verifying') || 'Verifying...') : t('verify') || 'Verify'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Recovery Codes Step */}
              {twoFactorData.step === 'recovery' && (
                <div className="two-factor-step">
                  <div className="step-description">
                    <p>{t('saveRecoveryCodes') || 'Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.'}</p>
                    <div className="warning-message">
                      ⚠️ {t('recoveryCodesWarning') || 'Each code can only be used once. These codes will not be shown again.'}
                    </div>
                    <p className="whatsapp-style-note">🛡️ <strong>WhatsApp-style Security:</strong> You'll only need to verify every 15 days. Keep these codes safe for emergencies.</p>
                  </div>
                  
                  <div className="recovery-codes-container">
                    <div className="recovery-codes">
                      {twoFactorData.recoveryCodes.map((code, index) => (
                        <div key={index} className="recovery-code">
                          <code>{code}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="recovery-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        const codesText = twoFactorData.recoveryCodes.join('\n');
                        navigator.clipboard.writeText(codesText);
                        setSaveStatus('✅ ' + (t('recoveryCodesCopied') || 'Recovery codes copied to clipboard!'));
                        setTimeout(() => setSaveStatus(''), 3000);
                      }}
                    >
                      📋 {t('copyAllCodes') || 'Copy All Codes'}
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        const codesText = twoFactorData.recoveryCodes.join('\n');
                        const blob = new Blob([codesText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `finovo-recovery-codes-${getTenantId()}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      💾 {t('downloadCodes') || 'Download Codes'}
                    </button>
                  </div>
                  
                  <div className="modal-footer">
                    <button 
                      className="btn-save" 
                      onClick={completeTwoFactorSetup}
                    >
                      {t('iveSavedTheseCodes') || "I've Saved These Codes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signout Confirmation Modal */}
      {showSignoutModal && (
        <div className="modal-overlay" onClick={() => setShowSignoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚪 {t('signOut') || 'Sign Out'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSignoutModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="signout-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <h4>{t('confirmSignOut') || 'Are you sure you want to sign out?'}</h4>
                  <p>{t('signOutWarning') || 'You will need to sign in again to access your account.'}</p>
                  <ul>
                    <li>{t('unsavedChangesLost') || 'All unsaved changes will be lost'}</li>
                    <li>{t('redirectToLogin') || 'You\'ll be redirected to the login page'}</li>
                    <li>{t('sessionDataCleared') || 'Your session data will be cleared'}</li>
                    {localSettings.privacy?.twoFactorAuth && (
                      <li>🛡️ {t('twoFactorWillRemain') || 'Two-factor authentication will remain enabled'}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowSignoutModal(false)}
                disabled={saving}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button 
                className="btn-danger" 
                onClick={handleSignout}
                disabled={saving}
              >
                {saving ? (t('signingOut') || 'Signing Out...') : t('yesSignOut') || 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;