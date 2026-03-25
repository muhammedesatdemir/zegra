/**
 * CalendarGrid Component
 *
 * Pixel-perfect 7-column grid with proper alignment.
 * Uses calculated cell sizes based on available width.
 * Weekday headers and day cells share the same width system.
 */

import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
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

// Turkish weekday abbreviations - with proper Turkish characters
const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function CalendarGrid({ days, selectedDate, onDayPress }: CalendarGridProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Calculate cell size based on screen width
  // Grid padding: 12px each side = 24px total
  const gridPadding = 24;
  const availableWidth = screenWidth - gridPadding;
  const cellSize = Math.floor(availableWidth / 7);

  return (
    <View style={styles.container}>
      {/* Weekday Headers - Perfectly aligned with grid */}
      <View style={[styles.weekdayRow, { paddingHorizontal: gridPadding / 2 }]}>
        {WEEKDAYS.map((day, index) => {
          const isWeekend = index >= 5;
          return (
            <View key={day} style={[styles.weekdayCell, { width: cellSize }]}>
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

      {/* Subtle Separator */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* Day Grid - Same padding as header for alignment */}
      {/* CRITICAL: Use unique keys to prevent slot reuse bugs across months */}
      <View style={[styles.grid, { paddingHorizontal: gridPadding / 2 }]}>
        {days.map((item, index) => {
          // Unique key: real dates use dateStr, empty cells use position index
          const cellKey = item.dateStr ?? `empty-${index}`;
          return (
            <DayCell
              key={cellKey}
              day={item.day}
              dateStr={item.dateStr}
              plannedDay={item.plannedDay}
              shiftType={item.shiftType}
              isToday={item.isToday}
              isSelected={item.dateStr === selectedDate}
              cellSize={cellSize}
              onPress={() => item.dateStr && onDayPress(item.dateStr)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  weekdayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
    opacity: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
    paddingBottom: 4,
  },
});
