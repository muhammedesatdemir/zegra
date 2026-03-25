/**
 * CalendarHeader Component
 *
 * Modern, clean header with month/year display and navigation.
 * Centered title with subtle arrow buttons.
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
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Previous Month Button */}
      <Pressable
        style={({ pressed }) => [
          styles.navButton,
          { backgroundColor: colors.surfaceSecondary },
          pressed && styles.navButtonPressed,
        ]}
        onPress={onPrevious}
      >
        <View style={styles.arrowLeft} />
      </Pressable>

      {/* Month Title - Tap to go to today */}
      <Pressable
        style={({ pressed }) => [
          styles.titleContainer,
          pressed && { opacity: 0.7 },
        ]}
        onPress={onToday}
      >
        <Text style={[styles.monthText, { color: colors.text }]}>
          {getMonthNameTR(month)}
        </Text>
        <Text style={[styles.yearText, { color: colors.textSecondary }]}>
          {year}
        </Text>
      </Pressable>

      {/* Next Month Button */}
      <Pressable
        style={({ pressed }) => [
          styles.navButton,
          { backgroundColor: colors.surfaceSecondary },
          pressed && styles.navButtonPressed,
        ]}
        onPress={onNext}
      >
        <View style={styles.arrowRight} />
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
    paddingVertical: 14,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  arrowLeft: {
    width: 10,
    height: 10,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: '#3B82F6',
    transform: [{ rotate: '45deg' }, { translateX: 2 }],
  },
  arrowRight: {
    width: 10,
    height: 10,
    borderRightWidth: 2.5,
    borderTopWidth: 2.5,
    borderColor: '#3B82F6',
    transform: [{ rotate: '45deg' }, { translateX: -2 }],
  },
  titleContainer: {
    alignItems: 'center',
    gap: 2,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  yearText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
