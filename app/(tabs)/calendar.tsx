/**
 * Calendar Screen (Takvim)
 *
 * Modern monthly calendar view showing all shifts.
 * Premium design with clear grid, modern badges, and status indicators.
 * Single-screen layout without scrolling.
 */

import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useScheduleStore } from '../../src/stores';
import { getDayCount, getTodayISO } from '../../src/utils/date';
import { useTheme } from '../../src/context';
import {
  CalendarHeader,
  CalendarGrid,
  CalendarActions,
} from '../../src/components/calendar';

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const viewYear = useScheduleStore((state) => state.viewYear);
  const viewMonth = useScheduleStore((state) => state.viewMonth);
  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const selectedDate = useScheduleStore((state) => state.selectedDate);
  const goToPreviousMonth = useScheduleStore((state) => state.goToPreviousMonth);
  const goToNextMonth = useScheduleStore((state) => state.goToNextMonth);
  const goToToday = useScheduleStore((state) => state.goToToday);

  const today = getTodayISO();
  const daysInMonth = getDayCount(viewYear, viewMonth);

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  // Adjust for Monday start (0 = Monday)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Build calendar grid data
  const calendarDays = [];

  // Empty cells before first day
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push({
      day: null,
      dateStr: null,
      plannedDay: null,
      shiftType: null,
      isToday: false,
    });
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const plannedDay = plannedDays[dateStr] ?? null;
    const shiftType = plannedDay
      ? shiftTypes.find((st) => st.code === plannedDay.shiftCode) ?? null
      : null;

    calendarDays.push({
      day: d,
      dateStr,
      plannedDay,
      shiftType,
      isToday: dateStr === today,
    });
  }

  // Fill remaining cells to complete the grid (6 rows max)
  const totalCells = calendarDays.length;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remainingCells; i++) {
    calendarDays.push({
      day: null,
      dateStr: null,
      plannedDay: null,
      shiftType: null,
      isToday: false,
    });
  }

  const handleDayPress = (dateStr: string) => {
    router.push(`/day/${dateStr}`);
  };

  const handleGenerate = () => {
    router.push('/generate');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <CalendarHeader
        year={viewYear}
        month={viewMonth}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
      />

      {/* Calendar Grid */}
      <CalendarGrid
        days={calendarDays}
        selectedDate={selectedDate}
        onDayPress={handleDayPress}
      />

      {/* Actions */}
      <CalendarActions onGenerate={handleGenerate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
