/**
 * TodayShiftCard
 *
 * Premium hero card for today's shift.
 * Compact, refined, Turkish character support.
 * Note preview integrated (no separate card).
 */

import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context';
import type { PlannedDay, ShiftType } from '../../types';

interface TodayShiftCardProps {
  date: string;
  formattedDate: string;
  plannedDay: PlannedDay | null;
  shiftType: ShiftType | null;
  onCreatePlan?: () => void;
}

export function TodayShiftCard({
  date,
  formattedDate,
  plannedDay,
  shiftType,
  onCreatePlan,
}: TodayShiftCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const hasShift = plannedDay && shiftType;
  const hasNote = plannedDay?.note;
  const isLocked = plannedDay?.isLocked;

  // Background color based on shift
  const bgColor = shiftType?.color ?? (isDark ? '#4B5563' : '#9CA3AF');

  const handlePress = () => {
    router.push(`/day/${date}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: bgColor },
        pressed && styles.pressed,
      ]}
    >
      {/* Header Row: Label + Date + Lock */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>BUGÜN</Text>
          </View>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        {isLocked && (
          <View style={styles.lockIndicator}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      {hasShift ? (
        <View style={styles.content}>
          <Text style={styles.shiftName}>{shiftType.name}</Text>

          {shiftType.isWorking && shiftType.startTime && shiftType.endTime ? (
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {shiftType.startTime} – {shiftType.endTime}
              </Text>
              {shiftType.isOvernight && (
                <Text style={styles.overnightHint}>(ertesi gün)</Text>
              )}
            </View>
          ) : (
            <Text style={styles.statusText}>Bugün izinlisiniz</Text>
          )}

          {/* Note Preview - Integrated */}
          {hasNote && (
            <View style={styles.noteRow}>
              <Text style={styles.noteIcon}>📝</Text>
              <Text style={styles.noteText} numberOfLines={1}>
                {plannedDay.note}
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* No Plan State */
        <View style={styles.noPlanContent}>
          <Text style={styles.noPlanTitle}>Plan Yok</Text>
          <Text style={styles.noPlanSubtitle}>Henüz plan oluşturulmamış</Text>
          {onCreatePlan && (
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.createButtonPressed,
              ]}
              onPress={onCreatePlan}
            >
              <Text style={styles.createButtonText}>Plan Oluştur</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  lockIndicator: {
    opacity: 0.8,
  },
  lockIcon: {
    fontSize: 14,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  shiftName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  overnightHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'stretch',
    gap: 6,
  },
  noteIcon: {
    fontSize: 12,
  },
  noteText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  noPlanContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  noPlanTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  noPlanSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 14,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  createButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  createButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
});
