/**
 * UpcomingDays
 *
 * Horizontal scrollable 7-day preview.
 * Clean badges inside cards, no overflow.
 * Better visual hierarchy, no icon conflicts.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context';
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
              {/* Top Label: Bugün/Yarın - Inside card, no overflow */}
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
              <Text style={[styles.dayNum, { color: textColor }]}>
                {item.dayNum}
              </Text>

              {/* Shift Code */}
              <Text style={[styles.shiftCode, { color: textColor }]}>
                {item.shiftType?.shortName ?? '—'}
              </Text>

              {/* Bottom Indicator: Note or Lock (only one shown) */}
              {hasNote ? (
                <View style={styles.indicator}>
                  <Text style={styles.indicatorDot}>•</Text>
                </View>
              ) : isLocked ? (
                <View style={styles.indicator}>
                  <Text style={styles.indicatorIcon}>🔒</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
    gap: 8,
  },
  dayCard: {
    width: 64,
    height: 88,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  dayCardTomorrow: {
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  dayCardPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  dayLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  dayLabelToday: {
    backgroundColor: '#3B82F6',
  },
  dayLabelTomorrow: {
    backgroundColor: 'rgba(59, 130, 246, 0.7)',
  },
  dayLabelText: {
    fontSize: 9,
    fontWeight: '600',
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
    marginVertical: 1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  shiftCode: {
    fontSize: 12,
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  indicator: {
    marginTop: 4,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 12,
  },
  indicatorIcon: {
    fontSize: 10,
  },
});
