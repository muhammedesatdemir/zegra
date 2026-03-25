/**
 * CalendarHeader Component
 *
 * Clean, premium header with month/year and navigation.
 * Native calendar feel with modern refinements.
 */

import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../../context';
import { getMonthNameTR } from '../../utils/turkish';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  year,
  month,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Previous Month Button */}
      <Pressable
        style={({ pressed }) => [
          styles.navButton,
          pressed && styles.navButtonPressed,
        ]}
        onPress={onPrevious}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={[styles.arrowLeft, { borderColor: colors.primary || '#3B82F6' }]} />
      </Pressable>

      {/* Month + Year Title */}
      <Pressable
        style={({ pressed }) => [
          styles.titleContainer,
          pressed && { opacity: 0.6 },
        ]}
        onPress={onToday}
      >
        <Text style={[styles.monthText, { color: colors.text }]}>
          {getMonthNameTR(month)}
        </Text>
        <View style={styles.yearBadge}>
          <Text style={[styles.yearText, { color: colors.textSecondary }]}>
            {year}
          </Text>
        </View>
      </Pressable>

      {/* Next Month Button */}
      <Pressable
        style={({ pressed }) => [
          styles.navButton,
          pressed && styles.navButtonPressed,
        ]}
        onPress={onNext}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={[styles.arrowRight, { borderColor: colors.primary || '#3B82F6' }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    transform: [{ scale: 0.95 }],
  },
  arrowLeft: {
    width: 11,
    height: 11,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateX: 2 }],
  },
  arrowRight: {
    width: 11,
    height: 11,
    borderRightWidth: 2.5,
    borderTopWidth: 2.5,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateX: -2 }],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  yearBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
});
