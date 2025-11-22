//components/themesettings.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { settings, updateTheme: updateThemeSettings } = useSettings();
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#25D366');
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('Inter');

  // Sync theme with settings
  useEffect(() => {
    if (settings?.theme) {
      const themeMode = settings.theme.mode || 'light';
      
      // Handle auto theme
      if (themeMode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      } else {
        setTheme(themeMode);
      }
      
      // Update other theme properties
      if (settings.theme.primaryColor) {
        setPrimaryColor(settings.theme.primaryColor);
      }
      if (settings.theme.fontSize) {
        setFontSize(settings.theme.fontSize);
      }
      if (settings.theme.fontFamily) {
        setFontFamily(settings.theme.fontFamily);
      }
    }
  }, [settings]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // Add current theme
    root.classList.add(theme);
    body.classList.add(theme);
    
    // Apply primary color as CSS variable
    root.style.setProperty('--primary-color', primaryColor);
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[fontSize] || '16px');
    
    // Apply font family
    root.style.setProperty('--font-family', fontFamily);
    
    console.log(`🎨 Theme applied: ${theme}, Color: ${primaryColor}, Size: ${fontSize}, Font: ${fontFamily}`);
  }, [theme, primaryColor, fontSize, fontFamily]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (settings?.theme?.mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        setTheme(e.matches ? 'dark' : 'light');
        console.log(`🎨 System theme changed to: ${e.matches ? 'dark' : 'light'}`);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [settings?.theme?.mode]);

  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      
      // Optimistically update local state
      setTheme(newTheme);
      
      // Update in backend
      await updateThemeSettings({ mode: newTheme });
      
      console.log(`✅ Theme toggled to: ${newTheme}`);
    } catch (error) {
      console.error('❌ Error toggling theme:', error);
      // Revert on error
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  // Set specific theme
  const setThemeMode = async (mode) => {
    try {
      // Update in backend
      await updateThemeSettings({ mode });
      
      console.log(`✅ Theme set to: ${mode}`);
    } catch (error) {
      console.error('❌ Error setting theme:', error);
    }
  };

  // Update primary color
  const updatePrimaryColor = async (color) => {
    try {
      setPrimaryColor(color);
      await updateThemeSettings({ primaryColor: color });
      console.log(`✅ Primary color updated to: ${color}`);
    } catch (error) {
      console.error('❌ Error updating primary color:', error);
    }
  };

  // Update font size
  const updateFontSize = async (size) => {
    try {
      setFontSize(size);
      await updateThemeSettings({ fontSize: size });
      console.log(`✅ Font size updated to: ${size}`);
    } catch (error) {
      console.error('❌ Error updating font size:', error);
    }
  };

  // Update font family
  const updateFontFamily = async (family) => {
    try {
      setFontFamily(family);
      await updateThemeSettings({ fontFamily: family });
      console.log(`✅ Font family updated to: ${family}`);
    } catch (error) {
      console.error('❌ Error updating font family:', error);
    }
  };

  const value = {
    theme,
    primaryColor,
    fontSize,
    fontFamily,
    toggleTheme,
    setTheme: setThemeMode,
    updatePrimaryColor,
    updateFontSize,
    updateFontFamily
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};