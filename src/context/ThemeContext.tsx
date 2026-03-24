/**
 * Theme Context
 *
 * Provides theme colors across the app.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useScheduleStore } from '../stores';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  primary: string;
  primaryLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningText: string;
}

const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  text: '#1F2937',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  primary: '#3B82F6',
  primaryLight: '#EFF6FF',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#FEF3C7',
  warningText: '#92400E',
};

const darkTheme: ThemeColors = {
  background: '#111827',
  surface: '#1F2937',
  surfaceSecondary: '#374151',
  text: '#F9FAFB',
  textSecondary: '#E5E7EB',
  textMuted: '#9CA3AF',
  border: '#374151',
  borderLight: '#4B5563',
  primary: '#3B82F6',
  primaryLight: '#1E3A5F',
  danger: '#EF4444',
  dangerLight: '#7F1D1D',
  warning: '#78350F',
  warningText: '#FEF3C7',
};

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightTheme,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useScheduleStore((state) => state.settings.theme);

  const value = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      colors: isDark ? darkTheme : lightTheme,
      isDark,
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
