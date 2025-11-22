// src/hooks/useGlobalSettings.js
import { useState, useEffect, useCallback } from 'react';

export const useGlobalSettings = () => {
  const [globalSettings, setGlobalSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage on initial load
  useEffect(() => {
    const loadGlobalSettings = () => {
      try {
        const savedSettings = localStorage.getItem('globalSettings');
        if (savedSettings) {
          setGlobalSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading global settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGlobalSettings();
  }, []);

  // Update global settings
  const updateGlobalSettings = useCallback((newSettings) => {
    setGlobalSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('globalSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update specific setting
  const updateSetting = useCallback((section, key, value) => {
    setGlobalSettings(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...prev?.[section],
          [key]: value
        }
      };
      localStorage.setItem('globalSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    globalSettings,
    updateGlobalSettings,
    updateSetting,
    loading
  };
};