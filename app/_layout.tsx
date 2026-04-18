/**
 * Root Layout
 *
 * Startup orchestration:
 *
 *   1. preventAutoHide() runs at module load, before React renders anything.
 *      This freezes the native splash so it won't disappear the moment the
 *      JS bundle is evaluated — which is what caused the 2–9s blank screen
 *      between the too-early splash hide and the first painted UI.
 *
 *   2. The schedule store has already hydrated synchronously from disk
 *      (see scheduleStore.ts — file.textSync read at module load), so the
 *      first render already has shifts / templates / planned days / settings.
 *
 *   3. The first visible screen calls notifyFirstScreenReady() from its
 *      onLayout. splashController waits one animation frame, then dismisses
 *      the native splash exactly once. User sees: splash → real UI.
 *
 *   4. A 4s watchdog runs from here so the user is never trapped behind a
 *      splash if the first screen fails to signal readiness.
 *
 * Local-first guarantee:
 *   Nothing in this file reads, writes, or transforms app data. Splash
 *   lifecycle is independent of persistence.
 */

import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/context';
import { mark as startupMark } from '../src/utils/startupTimer';
import {
  preventAutoHide,
  startSplashWatchdog,
} from '../src/utils/splashController';

startupMark('root layout: module evaluated');
preventAutoHide();

function NavigationContent() {
  const { colors, isDark } = useTheme();
  const shellLaidOutRef = useRef(false);

  startupMark('root layout: render');

  const onShellLayout = () => {
    if (shellLaidOutRef.current) return;
    shellLaidOutRef.current = true;
    startupMark('root layout: first shell layout');
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      onLayout={onShellLayout}
    >
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
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => startSplashWatchdog(4000), []);

  return (
    <ThemeProvider>
      <NavigationContent />
    </ThemeProvider>
  );
}
