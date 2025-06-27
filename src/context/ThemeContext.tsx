// src/context/ThemeContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, saveUserProfile } from '@/services/firestore';

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
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Initialize with cached theme if available on client side
    if (typeof window !== 'undefined') {
      try {
        const cachedTheme = localStorage.getItem('bago-cached-theme');
        const cachedSystemDefault = localStorage.getItem('bago-system-default');
        if (cachedTheme || cachedSystemDefault) {
          return {
            ...DEFAULT_SETTINGS,
            theme: cachedSystemDefault === 'true' ? 'system' : (cachedTheme as 'light' | 'dark') || 'light'
          };
        }
      } catch (error) {
        console.warn('[ThemeContext] Error reading cached theme:', error);
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    // Initialize system theme immediately if possible
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

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
      const newSystemTheme = e.matches ? 'dark' : 'light';
      console.log(`[ThemeContext] System theme changed to: ${newSystemTheme}`);
      setSystemTheme(newSystemTheme);
      
      // If user has system default enabled, update cache immediately
      if (settings.theme === 'system') {
        try {
          localStorage.setItem('bago-cached-theme', newSystemTheme);
          console.log(`[ThemeContext] Updated cached theme for system default: ${newSystemTheme}`);
        } catch (error) {
          console.warn('[ThemeContext] Error caching system theme change:', error);
        }
      }
    };

    // Set initial system theme
    const initialSystemTheme = mediaQuery.matches ? 'dark' : 'light';
    setSystemTheme(initialSystemTheme);
    
    // If using system theme, ensure cache is current
    if (settings.theme === 'system') {
      try {
        localStorage.setItem('bago-cached-theme', initialSystemTheme);
      } catch (error) {
        console.warn('[ThemeContext] Error setting initial system theme cache:', error);
      }
    }
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const loadSettings = async () => {
    if (!userId) {
      // When no user is logged in, still check for cached theme from previous session
      console.log("[ThemeContext] No user logged in, using cached or default settings");
      try {
        const cachedTheme = localStorage.getItem('bago-cached-theme');
        const isSystemDefault = localStorage.getItem('bago-system-default') === 'true';
        
        if (isSystemDefault || cachedTheme) {
          const themeToUse: 'light' | 'dark' | 'system' = isSystemDefault ? 'system' : (cachedTheme as 'light' | 'dark') || 'light';
          const settingsToUse: AppSettings = {
            ...DEFAULT_SETTINGS,
            theme: themeToUse
          };
          setSettings(settingsToUse);
          console.log("[ThemeContext] Applied cached theme for anonymous user:", themeToUse);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.warn('[ThemeContext] Error reading cached theme for anonymous user:', error);
        setSettings(DEFAULT_SETTINGS);
      }
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
        
        // Check if user has a cached theme preference that differs from database
        const cachedTheme = localStorage.getItem('bago-cached-theme');
        const isSystemDefault = localStorage.getItem('bago-system-default') === 'true';
        
        // If user has cached theme settings that differ from database, prioritize cache
        if (cachedTheme && (cachedTheme === 'light' || cachedTheme === 'dark')) {
          const preferredTheme: 'light' | 'dark' | 'system' = isSystemDefault ? 'system' : (cachedTheme as 'light' | 'dark');
          const shouldUseCache = isSystemDefault || (preferredTheme !== loadedSettings.theme);
          
          if (shouldUseCache) {
            console.log(`[ThemeContext] Theme conflict detected! Database: ${loadedSettings.theme}, Cache: ${preferredTheme}. Using cache.`);
            loadedSettings.theme = preferredTheme;
            
            // Update database in background to sync with user preference
            setTimeout(async () => {
              try {
                await saveUserProfile(userId, { settings: loadedSettings });
                console.log(`[ThemeContext] Synced cached theme ${preferredTheme} to database`);
              } catch (error) {
                console.warn('[ThemeContext] Failed to sync theme to database:', error);
              }
            }, 1000);
          } else {
            console.log(`[ThemeContext] Database and cache themes match: ${loadedSettings.theme}`);
          }
        } else {
          console.log(`[ThemeContext] No valid cached theme found, using database: ${loadedSettings.theme}`);
        }
        
        setSettings(loadedSettings);
        
        // Cache theme settings for next session
        try {
          if (loadedSettings.theme === 'system') {
            localStorage.setItem('bago-system-default', 'true');
            // For system theme, store the current resolved theme for initial render
            const currentSystemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            localStorage.setItem('bago-cached-theme', currentSystemTheme);
            console.log(`[ThemeContext] Cached system theme as: ${currentSystemTheme}`);
          } else {
            localStorage.setItem('bago-system-default', 'false');
            localStorage.setItem('bago-cached-theme', loadedSettings.theme);
            console.log(`[ThemeContext] Cached manual theme as: ${loadedSettings.theme}`);
          }
        } catch (error) {
          console.warn('[ThemeContext] Error caching theme:', error);
        }
        
        console.log("[ThemeContext] Loaded settings:", loadedSettings);
      } else {
        console.log("[ThemeContext] No profile found, using defaults");
        // Cache the default settings
        try {
          localStorage.setItem('bago-system-default', 'false');
          localStorage.setItem('bago-cached-theme', DEFAULT_SETTINGS.theme);
        } catch (error) {
          console.warn('[ThemeContext] Error caching default theme:', error);
        }
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
    if (typeof window === 'undefined') return;
    
    const actualTheme = getActualTheme(settings.theme);
    const root = window.document.documentElement;
    const body = document.body;
    
    // Check if theme was already applied by initialization script
    const alreadyInitialized = (window as any).__THEME_INITIALIZED__;
    const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
    
    console.log(`[ThemeContext] Applying theme: ${actualTheme} (from setting: ${settings.theme}, system: ${systemTheme}, isLoading: ${isLoading}, alreadyInit: ${alreadyInitialized}, current: ${currentTheme})`);
    
    // Only apply theme if it's different from current or not initialized
    if (!alreadyInitialized || currentTheme !== actualTheme) {
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
      
      console.log(`[ThemeContext] Theme updated from ${currentTheme} to ${actualTheme}`);
    } else {
      console.log(`[ThemeContext] Theme already correct: ${actualTheme}`);
    }
    
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
    
  }, [settings, systemTheme, isLoading]); // Added isLoading back for better logging

  const refreshSettings = async () => {
    await loadSettings();
  };

  // Function to update settings immediately (for real-time updates from Settings page)
  const updateSettings = (newSettings: AppSettings) => {
    console.log("[ThemeContext] Updating settings immediately:", newSettings);
    setSettings(newSettings);
    
    // Cache theme settings for persistence
    try {
      if (newSettings.theme === 'system') {
        localStorage.setItem('bago-system-default', 'true');
        // For system theme, store the current resolved theme for initial render
        const currentSystemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        localStorage.setItem('bago-cached-theme', currentSystemTheme);
        console.log(`[ThemeContext] User selected system theme, cached as: ${currentSystemTheme}`);
      } else {
        localStorage.setItem('bago-system-default', 'false');
        localStorage.setItem('bago-cached-theme', newSettings.theme);
        console.log(`[ThemeContext] User selected manual theme: ${newSettings.theme}`);
      }
    } catch (error) {
      console.warn('[ThemeContext] Error caching theme on update:', error);
    }
    
    // Also save to database immediately for manual theme changes
    if (userId) {
      setTimeout(async () => {
        try {
          await saveUserProfile(userId, { settings: newSettings });
          console.log(`[ThemeContext] Saved manual theme change to database: ${newSettings.theme}`);
        } catch (error) {
          console.warn('[ThemeContext] Failed to save theme change to database:', error);
        }
      }, 500); // Shorter delay for manual changes
    }
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