"use client";

import { useState, useEffect } from 'react';

export const useThemeSettings = () => {
  const [lightTheme, setLightTheme] = useState(() => {
    return localStorage.getItem('lightTheme') === 'true';
  });

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      setLightTheme(localStorage.getItem('lightTheme') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isDark = !lightTheme;

  return {
    isDark,
    lightTheme,
    setLightTheme,
  };
};
