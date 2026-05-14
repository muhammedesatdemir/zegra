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
  // Tint background + foreground for icon chips (quick-action cards etc.).
  // iconChipBg is intentionally a touch darker than primaryLight so that
  // thin glyph icons (e.g. the stopwatch ⏱) keep enough contrast in light
  // mode; iconChipFg is the explicit glyph color for those non-emoji icons.
  iconChipBg: string;
  iconChipFg: string;
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
  iconChipBg: '#DBEAFE',  // blue-100 — darker than primaryLight for contrast
  iconChipFg: '#1D4ED8',  // blue-700 — explicit color for thin glyph icons
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
  iconChipBg: '#1E3A5F',  // unchanged dark-mode tint — already reads fine
  iconChipFg: '#93C5FD',  // blue-300 — light glyph color for dark surfaces
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
