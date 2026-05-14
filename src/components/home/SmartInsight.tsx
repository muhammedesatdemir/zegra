/**
 * SmartInsight
 *
 * Micro information line between Today card and UpcomingDays.
 * Shows contextual info like "Sonraki izin: 2 gün sonra"
 * or "3 gün üst üste çalışıyorsun".
 *
 * Optionally a secondary motivation line is shown below the primary message
 * (e.g. "Yarıyı gördük, bozmadan ilerle.") — kept smaller and less prominent
 * so the card doesn't feel cluttered.
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context';

interface SmartInsightProps {
  message: string;
  icon?: string;
  subMessage?: string;
}

export function SmartInsight({ message, icon = '💡', subMessage }: SmartInsightProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textWrap}>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
        {subMessage && (
          <Text style={[styles.subMessage, { color: colors.textMuted }]}>
            {subMessage}
          </Text>
        )}
      </View>
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
  textWrap: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  subMessage: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
});
