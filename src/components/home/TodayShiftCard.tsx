/**
 * TodayShiftCard
 *
 * Premium hero card for today's shift.
 * Includes context line: "Sonraki vardiya: ..."
 * Subtle depth via shadow and overlay.
 */

import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context';
import type { PlannedDay, ShiftType } from '../../types';

interface NextShiftInfo {
  dayLabel: string;
  shiftName: string;
  time?: string;
}

interface TodayShiftCardProps {
  date: string;
  formattedDate: string;
  plannedDay: PlannedDay | null;
  shiftType: ShiftType | null;
  nextWorkingShift?: NextShiftInfo | null;
  onCreatePlan?: () => void;
}

export function TodayShiftCard({
  date,
  formattedDate,
  plannedDay,
  shiftType,
  nextWorkingShift,
  onCreatePlan,
}: TodayShiftCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();

  const hasShift = plannedDay && shiftType;
  const hasNote = plannedDay?.note;
  const isLocked = plannedDay?.isLocked;
  const isOff = hasShift && !shiftType.isWorking;

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
      {/* Subtle depth overlays (top highlight, bottom shadow) */}
      <View style={styles.topHighlight} />
      <View style={styles.bottomShadow} />

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

          {/* Context Line - Next shift info (especially useful for Off days) */}
          {nextWorkingShift && (
            <View style={styles.contextLine}>
              <Text style={styles.contextText}>
                Sonraki: {nextWorkingShift.dayLabel} {nextWorkingShift.shiftName}
                {nextWorkingShift.time ? ` ${nextWorkingShift.time}` : ''}
              </Text>
            </View>
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.8,
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
    opacity: 0.85,
  },
  lockIcon: {
    fontSize: 14,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  shiftName: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    fontSize: 17,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
  },
  overnightHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statusText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
  },
  contextLine: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
  },
  contextText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
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
    paddingVertical: 10,
  },
  noPlanTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  noPlanSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 16,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  createButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  createButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  createButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 15,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
});
