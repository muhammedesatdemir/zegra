/**
 * Calendar Screen (Takvim)
 *
 * Monthly calendar view showing all shifts.
 */

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useScheduleStore } from '../../src/stores';
import { getMonthNameTR } from '../../src/utils/turkish';
import { getDayCount, getTodayISO } from '../../src/utils/date';
import { useTheme } from '../../src/context';

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const viewYear = useScheduleStore((state) => state.viewYear);
  const viewMonth = useScheduleStore((state) => state.viewMonth);
  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const goToPreviousMonth = useScheduleStore((state) => state.goToPreviousMonth);
  const goToNextMonth = useScheduleStore((state) => state.goToNextMonth);
  const goToToday = useScheduleStore((state) => state.goToToday);

  const today = getTodayISO();
  const daysInMonth = getDayCount(viewYear, viewMonth);

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  // Adjust for Monday start (0 = Monday)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Build calendar grid
  const calendarDays = [];

  // Empty cells before first day
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push({ day: null, dateStr: null });
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const plannedDay = plannedDays[dateStr];
    const shiftType = plannedDay
      ? shiftTypes.find((st) => st.code === plannedDay.shiftCode)
      : null;

    calendarDays.push({
      day: d,
      dateStr,
      plannedDay,
      shiftType,
      isToday: dateStr === today,
    });
  }

  // Weekday headers
  const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    header: { backgroundColor: colors.surface, borderBottomColor: colors.border },
    monthTitle: { color: colors.text },
    weekdayHeader: { backgroundColor: colors.surface, borderBottomColor: colors.border },
    weekdayText: { color: colors.textMuted },
    dayCell: { backgroundColor: colors.surface },
    dayNumber: { color: colors.textSecondary },
    footer: { backgroundColor: colors.surface, borderTopColor: colors.border },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Month Navigation */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'<'}</Text>
        </Pressable>

        <Pressable onPress={goToToday}>
          <Text style={[styles.monthTitle, dynamicStyles.monthTitle]}>
            {getMonthNameTR(viewMonth)} {viewYear}
          </Text>
        </Pressable>

        <Pressable onPress={goToNextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'>'}</Text>
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={[styles.weekdayHeader, dynamicStyles.weekdayHeader]}>
        {weekdays.map((day) => (
          <Text key={day} style={[styles.weekdayText, dynamicStyles.weekdayText]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.calendarScroll}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.dayCell,
                dynamicStyles.dayCell,
                item.day === null && styles.dayCellEmpty,
                item.isToday && styles.dayCellToday,
              ]}
              onPress={() =>
                item.dateStr && router.push(`/day/${item.dateStr}`)
              }
              disabled={item.day === null}
            >
              {item.day !== null && (
                <>
                  <Text
                    style={[
                      styles.dayNumber,
                      dynamicStyles.dayNumber,
                      item.isToday && styles.dayNumberToday,
                    ]}
                  >
                    {item.day}
                  </Text>
                  <View
                    style={[
                      styles.shiftBadge,
                      { backgroundColor: item.shiftType?.color ?? colors.border },
                    ]}
                  >
                    <Text style={styles.shiftBadgeText}>
                      {item.shiftType?.shortName ?? '-'}
                    </Text>
                  </View>
                  {item.plannedDay?.isLocked && (
                    <Text style={styles.lockIcon}>🔒</Text>
                  )}
                </>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Quick Actions */}
      <View style={[styles.footer, dynamicStyles.footer]}>
        <Pressable
          style={styles.footerButton}
          onPress={() => router.push('/generate')}
        >
          <Text style={styles.footerButtonText}>Ay Oluştur</Text>
        </Pressable>
        <Pressable
          style={styles.footerButton}
          onPress={() => router.push('/revise')}
        >
          <Text style={styles.footerButtonText}>Revize Et</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarScroll: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 0.9,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 1,
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayNumberToday: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  shiftBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  shiftBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  lockIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
