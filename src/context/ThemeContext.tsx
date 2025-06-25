// src/context/ThemeContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile } from '@/services/firestore';

interface AppSettings {
  theme: 'light' | 'dark';
  accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  progressViewPermission: 'friends_only' | 'request_only' | 'private';
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
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { userId, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

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
          theme: profile.settings.theme === 'system' ? 'light' : (profile.settings.theme as 'light' | 'dark')
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
    
    const root = window.document.documentElement;
    const body = document.body;
    
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
    
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
    
  }, [settings, isLoading]);

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <ThemeContext.Provider value={{
      settings,
      isDark: settings.theme === 'dark',
      isLoading: authLoading || isLoading,
      refreshSettings
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