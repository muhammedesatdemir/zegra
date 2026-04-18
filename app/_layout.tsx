/**
 * Root Layout
 *
 * Data is hydrated synchronously in the store module (see scheduleStore.ts),
 * so the first render already has shifts, templates, planned days and settings.
 * No async init, no splash race, no useEffect-driven loading flash.
 */

import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/context';
import { mark as startupMark } from '../src/utils/startupTimer';

startupMark('root layout: module evaluated');

function NavigationContent() {
  const { colors, isDark } = useTheme();

  // Wrapping in a themed View guarantees the area under the navigator is
  // painted with the app's background color from the very first frame,
  // so the user never sees a raw white flash between splash and first screen.
  // onLayout fires once the view is measured & laid out — the closest JS-side
  // proxy we have for "first meaningful paint of the shell".
  startupMark('root layout: render');
  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      onLayout={() => startupMark('root layout: first paint (onLayout)')}
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
  return (
    <ThemeProvider>
      <NavigationContent />
    </ThemeProvider>
  );
}
