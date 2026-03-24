/**
 * Root Layout
 *
 * Initializes the app and sets up navigation.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useScheduleStore } from '../src/stores';
import { ThemeProvider, useTheme } from '../src/context';

function NavigationContent() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="day/[date]"
          options={{
            title: 'Gün Düzenle',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="generate"
          options={{
            title: 'Ay Oluştur',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="revise"
          options={{
            title: 'Revize Et',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="templates/index"
          options={{
            title: 'Şablonlar',
          }}
        />
        <Stack.Screen
          name="templates/[id]"
          options={{
            title: 'Şablon Düzenle',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const loadAllData = useScheduleStore((state) => state.loadAllData);

  useEffect(() => {
    // Load data when app starts
    loadAllData();
  }, [loadAllData]);

  return (
    <ThemeProvider>
      <NavigationContent />
    </ThemeProvider>
  );
}
