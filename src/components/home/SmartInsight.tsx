/**
 * SmartInsight
 *
 * Micro information line between Today card and UpcomingDays.
 * Shows contextual info like "Sonraki izin: 2 gün sonra"
 * or "3 gün üst üste çalışıyorsun".
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context';

interface SmartInsightProps {
  message: string;
  icon?: string;
}

export function SmartInsight({ message, icon = '💡' }: SmartInsightProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
});
