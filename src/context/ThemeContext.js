// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#25D366');
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate hover color
  const calculateHoverColor = useCallback((color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const hoverR = Math.max(0, r - 25);
    const hoverG = Math.max(0, g - 25);
    const hoverB = Math.max(0, b - 25);
    
    return `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;
  }, []);

  // Professional light theme
  const applyLightTheme = useCallback((root) => {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8f9fa');
    root.style.setProperty('--bg-tertiary', '#f1f5f9');
    root.style.setProperty('--bg-sidebar', '#1f2937');
    root.style.setProperty('--bg-card', '#ffffff');
    root.style.setProperty('--bg-card-hover', '#f8fafc');
    root.style.setProperty('--bg-input', '#ffffff');
    root.style.setProperty('--bg-hover', '#f3f4f6');
    root.style.setProperty('--bg-modal', '#ffffff');
    root.style.setProperty('--bg-dropdown', '#ffffff');
    root.style.setProperty('--bg-tooltip', '#1f2937');
    
    root.style.setProperty('--text-primary', '#1f2937');
    root.style.setProperty('--text-secondary', '#6b7280');
    root.style.setProperty('--text-muted', '#9ca3af');
    root.style.setProperty('--text-inverse', '#ffffff');
    root.style.setProperty('--text-placeholder', '#6b7280');
    
    root.style.setProperty('--border-primary', '#e5e7eb');
    root.style.setProperty('--border-secondary', '#d1d5db');
    root.style.setProperty('--border-accent', '#cbd5e1');
    root.style.setProperty('--border-color', '#e5e7eb');
    
    root.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
    root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--shadow-xl', '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)');
    root.style.setProperty('--shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)');
    
    root.style.setProperty('--gradient-from', '#ffffff');
    root.style.setProperty('--gradient-to', '#f8fafc');
    
    root.style.setProperty('--success-color', '#10b981');
    root.style.setProperty('--warning-color', '#f59e0b');
    root.style.setProperty('--error-color', '#ef4444');
    root.style.setProperty('--danger-color', '#ef4444');
    root.style.setProperty('--info-color', '#3b82f6');
  }, []);

  // Professional dark theme with enhanced colors
  const applyDarkTheme = useCallback((root) => {
    // Deep professional dark palette
    root.style.setProperty('--bg-primary', '#0f1419');
    root.style.setProperty('--bg-secondary', '#1a1f26');
    root.style.setProperty('--bg-tertiary', '#252d38');
    root.style.setProperty('--bg-sidebar', '#0a0e12');
    root.style.setProperty('--bg-card', '#1a1f26');
    root.style.setProperty('--bg-card-hover', '#252d38');
    root.style.setProperty('--bg-input', '#252d38');
    root.style.setProperty('--bg-hover', '#2a3441');
    root.style.setProperty('--bg-modal', '#1a1f26');
    root.style.setProperty('--bg-dropdown', '#252d38');
    root.style.setProperty('--bg-tooltip', '#2a3441');
    
    // High contrast text for readability
    root.style.setProperty('--text-primary', '#e8eaed');
    root.style.setProperty('--text-secondary', '#9ba3af');
    root.style.setProperty('--text-muted', '#6b7280');
    root.style.setProperty('--text-inverse', '#0f1419');
    root.style.setProperty('--text-placeholder', '#6b7280');
    
    // Subtle borders for depth
    root.style.setProperty('--border-primary', '#2d3748');
    root.style.setProperty('--border-secondary', '#374151');
    root.style.setProperty('--border-accent', '#4b5563');
    root.style.setProperty('--border-color', '#2d3748');
    
    // Enhanced shadows for depth
    root.style.setProperty('--shadow-sm', '0 1px 3px 0 rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -2px rgba(0, 0, 0, 0.6)');
    root.style.setProperty('--shadow-xl', '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.7)');
    root.style.setProperty('--shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.4)');
    
    // Professional gradients
    root.style.setProperty('--gradient-from', '#1a1f26');
    root.style.setProperty('--gradient-to', '#0f1419');
    
    // Enhanced status colors for dark mode
    root.style.setProperty('--success-color', '#34d399');
    root.style.setProperty('--warning-color', '#fbbf24');
    root.style.setProperty('--error-color', '#f87171');
    root.style.setProperty('--danger-color', '#f87171');
    root.style.setProperty('--info-color', '#60a5fa');
  }, []);

  // Apply theme to DOM - ENHANCED
  const applyThemeToDOM = useCallback((themeMode, color, size, family) => {
    console.log('🎨 Applying theme to DOM:', { themeMode, color, size, family });
    
    const root = document.documentElement;
    const body = document.body;
    
    // Clear all theme classes
    root.classList.remove('light-mode', 'dark-mode', 'auto-mode');
    body.classList.remove('light-mode', 'dark-mode', 'auto-mode');
    
    // Determine effective theme
    let effectiveTheme = themeMode;
    if (themeMode === 'auto') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemPrefersDark ? 'dark' : 'light';
      root.classList.add('auto-mode');
      body.classList.add('auto-mode');
    }
    
    // Add theme classes to both root and body
    root.classList.add(`${effectiveTheme}-mode`);
    body.classList.add(`${effectiveTheme}-mode`);
    root.setAttribute('data-theme', effectiveTheme);
    body.setAttribute('data-theme', effectiveTheme);

    // Apply theme-specific CSS variables
    if (effectiveTheme === 'dark') {
      applyDarkTheme(root);
      // Professional dark mode body styling
      body.style.backgroundColor = '#0f1419';
      body.style.color = '#e8eaed';
      body.style.backgroundImage = 'linear-gradient(135deg, #0f1419 0%, #1a1f26 100%)';
      body.style.minHeight = '100vh';
    } else {
      applyLightTheme(root);
      // Light mode body styling
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#1f2937';
      body.style.backgroundImage = 'none';
    }

    // Apply primary color with enhanced dark mode compatibility
    const primaryHover = calculateHoverColor(color);
    root.style.setProperty('--primary-color', color);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--primary-50', `${color}20`);
    root.style.setProperty('--primary-100', `${color}30`);
    root.style.setProperty('--primary-200', `${color}40`);
    
    // Enhanced primary color variants for dark mode
    if (effectiveTheme === 'dark') {
      root.style.setProperty('--primary-color-dark', calculateHoverColor(color));
      root.style.setProperty('--primary-color-light', `${color}80`);
    }
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[size] || '16px');
    
    // Apply font family
    root.style.setProperty('--font-family', `${family}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);

    // Enhanced smooth transitions
    root.style.setProperty('--transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    root.style.setProperty('--transition-fast', 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)');
    root.style.setProperty('--transition-slow', 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)');

    // Force reflow
    void root.offsetHeight;
    void body.offsetHeight;

    console.log('✅ Theme applied successfully:', { 
      mode: themeMode, 
      effective: effectiveTheme, 
      color, 
      size, 
      family
    });
  }, [calculateHoverColor, applyLightTheme, applyDarkTheme]);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    const savedPrimaryColor = localStorage.getItem('primary-color') || '#25D366';
    const savedFontSize = localStorage.getItem('font-size') || 'medium';
    const savedFontFamily = localStorage.getItem('font-family') || 'Inter';

    console.log('🚀 Initializing theme:', {
      theme: savedTheme,
      color: savedPrimaryColor,
      size: savedFontSize,
      family: savedFontFamily
    });

    setTheme(savedTheme);
    setPrimaryColor(savedPrimaryColor);
    setFontSize(savedFontSize);
    setFontFamily(savedFontFamily);
    
    applyThemeToDOM(savedTheme, savedPrimaryColor, savedFontSize, savedFontFamily);
    setIsInitialized(true);
  }, [applyThemeToDOM]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      console.log('🔄 System theme changed:', e.matches ? 'dark' : 'light');
      applyThemeToDOM('auto', primaryColor, fontSize, fontFamily);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, primaryColor, fontSize, fontFamily, applyThemeToDOM]);

  // Update theme
  const updateTheme = useCallback((newTheme) => {
    console.log('🔄 Updating theme to:', newTheme);
    setTheme(newTheme);
    applyThemeToDOM(newTheme, primaryColor, fontSize, fontFamily);
    localStorage.setItem('app-theme', newTheme);
  }, [primaryColor, fontSize, fontFamily, applyThemeToDOM]);

  // Update primary color
  const updatePrimaryColor = useCallback((color) => {
    console.log('🎨 Updating primary color to:', color);
    setPrimaryColor(color);
    applyThemeToDOM(theme, color, fontSize, fontFamily);
    localStorage.setItem('primary-color', color);
  }, [theme, fontSize, fontFamily, applyThemeToDOM]);

  // Update font size
  const updateFontSize = useCallback((size) => {
    console.log('📏 Updating font size to:', size);
    setFontSize(size);
    applyThemeToDOM(theme, primaryColor, size, fontFamily);
    localStorage.setItem('font-size', size);
  }, [theme, primaryColor, fontFamily, applyThemeToDOM]);

  // Update font family
  const updateFontFamily = useCallback((family) => {
    console.log('🔤 Updating font family to:', family);
    setFontFamily(family);
    applyThemeToDOM(theme, primaryColor, fontSize, family);
    localStorage.setItem('font-family', family);
  }, [theme, primaryColor, fontSize, applyThemeToDOM]);

  const value = {
    theme,
    primaryColor,
    fontSize,
    fontFamily,
    isInitialized,
    updateTheme,
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