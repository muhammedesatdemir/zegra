/**
 * Tab Layout
 *
 * Main tab navigation: Ana Sayfa, Takvim, Ayarlar
 */

import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context';

// Simple icon component (will be replaced with proper icons later)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconMap: Record<string, string> = {
    home: '🏠',
    calendar: '📅',
    settings: '⚙️',
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {iconMap[name] ?? '•'}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
          headerTitle: () => (
            <View style={styles.brandHeader}>
              <Text style={styles.brandName}>Zekra</Text>
              <Text style={styles.brandProduct}>Vardiya Planı</Text>
            </View>
          ),
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Takvim',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
  brandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  brandProduct: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 1,
  },
});
