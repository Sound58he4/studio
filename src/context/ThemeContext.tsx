// src/context/ThemeContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile } from '@/services/firestore';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  progressViewPermission: 'private' | 'request_only' | 'public';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  accentColor: 'blue',
  fontSize: 'medium',
  compactMode: false,
  animations: true,
  progressViewPermission: 'request_only',
};

interface ThemeContextType {
  settings: AppSettings;
  isDark: boolean;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: AppSettings) => void; // Add this function
  actualTheme: 'light' | 'dark'; // The actual theme being used (resolved from system if needed)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { userId, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Function to get actual theme (resolving system preference if needed)
  const getActualTheme = (themeSettings: 'light' | 'dark' | 'system'): 'light' | 'dark' => {
    if (themeSettings === 'system') {
      return systemTheme;
    }
    return themeSettings;
  };

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const loadSettings = async () => {
    if (!userId) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }

    try {
      console.log("[ThemeContext] Loading settings for user:", userId);
      const profile = await getUserProfile(userId);
      if (profile && profile.settings) {
        const loadedSettings: AppSettings = {
          ...DEFAULT_SETTINGS,
          ...profile.settings,
          // Keep the theme as-is from database (including 'system')
          theme: profile.settings.theme || DEFAULT_SETTINGS.theme,
          // Ensure progressViewPermission is a valid value
          progressViewPermission: (profile.settings.progressViewPermission && ['private', 'request_only', 'public'].includes(profile.settings.progressViewPermission)) 
            ? profile.settings.progressViewPermission as 'private' | 'request_only' | 'public'
            : DEFAULT_SETTINGS.progressViewPermission
        };
        setSettings(loadedSettings);
        console.log("[ThemeContext] Loaded settings:", loadedSettings);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("[ThemeContext] Error loading settings:", error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadSettings();
    }
  }, [userId, authLoading]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return;
    
    const actualTheme = getActualTheme(settings.theme);
    const root = window.document.documentElement;
    const body = document.body;
    
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    
    // Update localStorage for compatibility with other components
    localStorage.setItem('lightTheme', (actualTheme === 'light').toString());
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'lightTheme',
      newValue: (actualTheme === 'light').toString(),
      oldValue: localStorage.getItem('lightTheme')
    }));
    
    root.classList.remove('accent-blue', 'accent-purple', 'accent-green', 'accent-orange', 'accent-red', 'accent-cyan');
    root.classList.add(`accent-${settings.accentColor}`);
    
    body.classList.remove('text-small', 'text-medium', 'text-large');
    body.classList.add(`text-${settings.fontSize}`);
    
    body.classList.toggle('compact-mode', settings.compactMode);
    body.classList.toggle('reduced-motion', !settings.animations);
    
    const accentColors = {
      blue: { hue: '220', sat: '70%', light: '55%' },
      purple: { hue: '260', sat: '70%', light: '65%' },
      green: { hue: '142', sat: '70%', light: '45%' },
      orange: { hue: '25', sat: '85%', light: '60%' },
      red: { hue: '0', sat: '70%', light: '55%' },
      cyan: { hue: '190', sat: '70%', light: '50%' }
    };
    
    const color = accentColors[settings.accentColor];
    root.style.setProperty('--primary', `${color.hue} ${color.sat} ${color.light}`);
    root.style.setProperty('--accent', `${color.hue} ${color.sat} ${color.light}`);
    
  }, [settings, isLoading, systemTheme]);

  const refreshSettings = async () => {
    await loadSettings();
  };

  // Function to update settings immediately (for real-time updates from Settings page)
  const updateSettings = (newSettings: AppSettings) => {
    console.log("[ThemeContext] Updating settings immediately:", newSettings);
    setSettings(newSettings);
  };

  const actualTheme = getActualTheme(settings.theme);

  return (
    <ThemeContext.Provider value={{
      settings,
      isDark: actualTheme === 'dark',
      isLoading: authLoading || isLoading,
      refreshSettings,
      updateSettings,
      actualTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}