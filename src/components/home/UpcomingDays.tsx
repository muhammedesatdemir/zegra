/**
 * UpcomingDays
 *
 * Horizontal scrollable 7-day preview.
 * Today card scaled and elevated.
 * Refined note indicator.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context';
import { getEffectiveShiftTime } from '../../utils/shiftTime';
import type { PlannedDay, ShiftType } from '../../types';

interface DayPreview {
  date: string;
  dayName: string;
  dayNum: number;
  plannedDay: PlannedDay | null;
  shiftType: ShiftType | null;
  isToday: boolean;
  isTomorrow: boolean;
}

interface UpcomingDaysProps {
  days: DayPreview[];
}

export function UpcomingDays({ days }: UpcomingDaysProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Önümüzdeki 7 Gün
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((item) => {
          const hasShift = item.plannedDay && item.shiftType;
          const bgColor = item.shiftType?.color ?? (isDark ? '#4B5563' : '#E5E7EB');
          const hasNote = item.plannedDay?.note;
          const isLocked = item.plannedDay?.isLocked;
          const effectiveTime = getEffectiveShiftTime(item.plannedDay, item.shiftType);
          const hasCustomTime = effectiveTime.isCustom;
          const textColor = hasShift ? '#fff' : (isDark ? '#D1D5DB' : '#374151');
          const mutedColor = hasShift ? 'rgba(255,255,255,0.75)' : (isDark ? '#9CA3AF' : '#6B7280');

          return (
            <Pressable
              key={item.date}
              style={({ pressed }) => [
                styles.dayCard,
                { backgroundColor: bgColor },
                item.isToday && styles.dayCardToday,
                item.isTomorrow && styles.dayCardTomorrow,
                pressed && styles.dayCardPressed,
              ]}
              onPress={() => router.push(`/day/${item.date}`)}
            >
              {/* Top Label: Bugün/Yarın - Inside card */}
              {(item.isToday || item.isTomorrow) ? (
                <View style={[
                  styles.dayLabel,
                  item.isToday ? styles.dayLabelToday : styles.dayLabelTomorrow,
                ]}>
                  <Text style={styles.dayLabelText}>
                    {item.isToday ? 'Bugün' : 'Yarın'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.dayName, { color: mutedColor }]}>
                  {item.dayName}
                </Text>
              )}

              {/* Day Number - Main focus */}
              <Text style={[
                styles.dayNum,
                { color: textColor },
                item.isToday && styles.dayNumToday,
              ]}>
                {item.dayNum}
              </Text>

              {/* Shift Code */}
              <Text style={[styles.shiftCode, { color: textColor }]}>
                {item.shiftType?.shortName ?? '—'}
              </Text>

              {/* Bottom Indicator: note bar, custom time dot, or lock */}
              <View style={styles.indicatorContainer}>
                {hasNote ? (
                  <View style={[
                    styles.noteBar,
                    { backgroundColor: hasShift ? 'rgba(255,255,255,0.4)' : colors.primary }
                  ]} />
                ) : hasCustomTime ? (
                  <View style={[
                    styles.customDot,
                    { backgroundColor: hasShift ? 'rgba(255,255,255,0.5)' : colors.primary }
                  ]} />
                ) : isLocked ? (
                  <Text style={styles.lockIcon}>🔒</Text>
                ) : (
                  <View style={styles.indicatorSpacer} />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  scrollContent: {
    paddingRight: 8,
    paddingVertical: 4,
    gap: 10,
  },
  dayCard: {
    width: 62,
    height: 92,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dayCardToday: {
    width: 68,
    height: 98,
    borderWidth: 2.5,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  dayCardTomorrow: {
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  dayCardPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  dayLabel: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 2,
  },
  dayLabelToday: {
    backgroundColor: '#3B82F6',
  },
  dayLabelTomorrow: {
    backgroundColor: 'rgba(59, 130, 246, 0.75)',
  },
  dayLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  dayName: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: 2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  dayNumToday: {
    fontSize: 22,
  },
  shiftCode: {
    fontSize: 12,
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  indicatorContainer: {
    marginTop: 4,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteBar: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  customDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  lockIcon: {
    fontSize: 9,
  },
  indicatorSpacer: {
    height: 3,
  },
});
