/**
 * CalendarGrid Component
 *
 * Main calendar grid with weekday headers and day cells.
 * Designed to fit on a single screen without scrolling.
 * Uses fixed proportions for consistent layout.
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context';
import { DayCell } from './DayCell';
import type { PlannedDay, ShiftType } from '../../types';

interface CalendarDayData {
  day: number | null;
  dateStr: string | null;
  plannedDay: PlannedDay | null;
  shiftType: ShiftType | null;
  isToday: boolean;
}

interface CalendarGridProps {
  days: CalendarDayData[];
  selectedDate: string | null;
  onDayPress: (dateStr: string) => void;
}

const WEEKDAYS = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

export function CalendarGrid({ days, selectedDate, onDayPress }: CalendarGridProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, index) => {
          const isWeekend = index >= 5;
          return (
            <View key={day} style={styles.weekdayCell}>
              <Text
                style={[
                  styles.weekdayText,
                  { color: isWeekend ? colors.textMuted : colors.textSecondary },
                ]}
              >
                {day}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Separator */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* Day Grid */}
      <View style={styles.grid}>
        {days.map((item, index) => (
          <DayCell
            key={index}
            day={item.day}
            dateStr={item.dateStr}
            plannedDay={item.plannedDay}
            shiftType={item.shiftType}
            isToday={item.isToday}
            isSelected={item.dateStr === selectedDate}
            onPress={() => item.dateStr && onDayPress(item.dateStr)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  weekdayCell: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  separator: {
    height: 1,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
  },
});
