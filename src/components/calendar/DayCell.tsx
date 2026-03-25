/**
 * DayCell Component
 *
 * Individual day cell in the calendar grid.
 * Shows day number, shift badge, and status indicators (note, lock).
 * Premium design with subtle shadows and modern badges.
 */

import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../../context';
import type { PlannedDay, ShiftType } from '../../types';

interface DayCellProps {
  day: number | null;
  dateStr: string | null;
  plannedDay: PlannedDay | null;
  shiftType: ShiftType | null;
  isToday: boolean;
  isSelected?: boolean;
  onPress: () => void;
}

export function DayCell({
  day,
  dateStr,
  plannedDay,
  shiftType,
  isToday,
  isSelected,
  onPress,
}: DayCellProps) {
  const { colors } = useTheme();

  // Empty cell
  if (day === null) {
    return <View style={styles.cell} />;
  }

  const hasNote = Boolean(plannedDay?.note);
  const isLocked = Boolean(plannedDay?.isLocked);
  const hasShift = Boolean(shiftType);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cell,
        styles.dayCell,
        { backgroundColor: colors.surface },
        isToday && styles.todayCell,
        isToday && { borderColor: '#3B82F6' },
        isSelected && styles.selectedCell,
        isSelected && { backgroundColor: '#EBF4FF' },
        pressed && styles.pressedCell,
      ]}
      onPress={onPress}
    >
      {/* Day Number */}
      <Text
        style={[
          styles.dayNumber,
          { color: colors.textSecondary },
          isToday && styles.todayNumber,
          !hasShift && styles.emptyDayNumber,
        ]}
      >
        {day}
      </Text>

      {/* Shift Badge */}
      {hasShift ? (
        <View
          style={[
            styles.shiftBadge,
            { backgroundColor: shiftType!.color },
          ]}
        >
          {/* Subtle inner highlight for depth */}
          <View style={styles.badgeHighlight} />
          <Text style={styles.shiftText}>{shiftType!.shortName}</Text>
        </View>
      ) : (
        <View style={[styles.emptyBadge, { backgroundColor: colors.border }]}>
          <View style={[styles.emptyLine, { backgroundColor: colors.textMuted }]} />
        </View>
      )}

      {/* Status Indicators Container */}
      {(hasNote || isLocked) && (
        <View style={styles.indicators}>
          {/* Note Indicator - small pencil dot */}
          {hasNote && (
            <View style={[styles.noteIndicator, { backgroundColor: '#F59E0B' }]} />
          )}
          {/* Lock Indicator */}
          {isLocked && (
            <View style={styles.lockIndicator}>
              <View style={[styles.lockBody, { backgroundColor: colors.textMuted }]} />
              <View style={[styles.lockShackle, { borderColor: colors.textMuted }]} />
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '14.28%',
    aspectRatio: 0.85,
    padding: 3,
  },
  dayCell: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  todayCell: {
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCell: {
    shadowOpacity: 0.08,
    elevation: 2,
  },
  pressedCell: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  todayNumber: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyDayNumber: {
    opacity: 0.5,
  },

  // Shift Badge
  shiftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shiftText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },

  // Empty Badge
  emptyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLine: {
    width: 12,
    height: 2,
    borderRadius: 1,
    opacity: 0.4,
  },

  // Indicators
  indicators: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  noteIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lockIndicator: {
    width: 8,
    height: 10,
    alignItems: 'center',
  },
  lockBody: {
    width: 8,
    height: 6,
    borderRadius: 1.5,
    position: 'absolute',
    bottom: 0,
  },
  lockShackle: {
    width: 5,
    height: 5,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderRadius: 3,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'absolute',
    top: 0,
  },
});
