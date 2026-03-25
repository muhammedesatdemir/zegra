/**
 * DayCell Component
 *
 * Individual day cell with full-cell coloring based on shift type.
 * Premium design with proper indicator positioning:
 * - Note indicator: top-left (amber dot)
 * - Lock indicator: top-right (small lock)
 * - Day number: center-top area
 * - Shift label: center-bottom area
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
  cellSize: number;
  onPress: () => void;
}

// FINAL COLOR SYSTEM - using shift type's own color as base
// Background colors are soft versions, text colors provide contrast
const SHIFT_BG_COLORS: Record<string, string> = {
  S: '#DCFCE7',      // Soft green for Sabah
  Ö: '#FED7AA',      // Soft orange for Öğle - TURKISH Ö CHARACTER
  G: '#DBEAFE',      // Soft blue for Gece
  Off: '#F1F5F9',    // Slate gray for Off
};

const SHIFT_TEXT_COLORS: Record<string, string> = {
  S: '#166534',      // Dark green
  Ö: '#C2410C',      // Dark orange - TURKISH Ö CHARACTER
  G: '#1D4ED8',      // Dark blue
  Off: '#475569',    // Slate text
};

// Get colors - prefer shift type's native color, fallback to our premium palette
function getShiftColors(
  shiftType: ShiftType | null
): { bg: string; text: string } {
  if (!shiftType) {
    return { bg: '#F9FAFB', text: '#9CA3AF' };
  }

  const shortName = shiftType.shortName;

  // Check our premium color palette first (handles S, Ö, G, Off)
  if (shortName && SHIFT_BG_COLORS[shortName]) {
    return {
      bg: SHIFT_BG_COLORS[shortName],
      text: SHIFT_TEXT_COLORS[shortName],
    };
  }

  // Check for Off variants
  if (shortName?.toLowerCase().includes('off')) {
    return {
      bg: SHIFT_BG_COLORS.Off,
      text: SHIFT_TEXT_COLORS.Off,
    };
  }

  // Fallback: use shift type's own color with calculated contrast
  // Create soft background from shift's color
  const baseColor = shiftType.color || '#9CA3AF';
  return {
    bg: baseColor + '20', // 12% opacity version
    text: baseColor,
  };
}

export function DayCell({
  day,
  plannedDay,
  shiftType,
  isToday,
  isSelected,
  cellSize,
  onPress,
}: DayCellProps) {
  const { colors } = useTheme();

  // Empty cell (days from prev/next month) - same structure for layout consistency
  if (day === null) {
    return (
      <View style={[styles.cellWrapper, { width: cellSize, height: cellSize * 1.15 }]}>
        <View style={[styles.cell, styles.emptyCell, { backgroundColor: colors.background }]}>
          {/* Keep same internal structure for consistent layout */}
          <Text style={[styles.dayNumber, { opacity: 0 }]}> </Text>
          <View style={styles.emptyShiftPlaceholder}>
            <View style={{ width: 12, height: 2 }} />
          </View>
        </View>
      </View>
    );
  }

  const hasNote = Boolean(plannedDay?.note);
  const isLocked = Boolean(plannedDay?.isLocked);
  const hasShift = Boolean(shiftType);

  // Get colors based on shift type
  const shiftColors = getShiftColors(shiftType);

  return (
    <View style={[styles.cellWrapper, { width: cellSize, height: cellSize * 1.15 }]}>
      {/* Today glow effect - behind the cell */}
      {isToday && <View style={styles.todayGlow} />}

      <Pressable
        style={({ pressed }) => [
          styles.cell,
          { backgroundColor: hasShift ? shiftColors.bg : colors.surface },
          isToday && styles.todayCell,
          isSelected && !isToday && styles.selectedCell,
          pressed && styles.pressedCell,
        ]}
        onPress={onPress}
      >
        {/* Note Indicator - Top Left */}
        {hasNote && (
          <View style={styles.noteIndicator}>
            <View style={styles.noteDot} />
          </View>
        )}

        {/* Lock Indicator - Top Right */}
        {isLocked && (
          <View style={styles.lockIndicator}>
            <View style={styles.lockBody} />
            <View style={styles.lockShackle} />
          </View>
        )}

        {/* Day Number */}
        <Text
          style={[
            styles.dayNumber,
            { color: hasShift ? shiftColors.text : colors.textSecondary },
            isToday && styles.todayNumber,
            !hasShift && styles.emptyDayNumber,
          ]}
        >
          {day}
        </Text>

        {/* Shift Label */}
        {hasShift ? (
          <View style={[styles.shiftLabel, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
            <Text
              style={[styles.shiftText, { color: shiftColors.text }]}
              numberOfLines={1}
            >
              {shiftType!.shortName}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyShiftPlaceholder}>
            <View style={[styles.emptyLine, { backgroundColor: colors.border }]} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cellWrapper: {
    padding: 3,
    position: 'relative',
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  emptyCell: {
    opacity: 0.3,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Today styling - clear and prominent
  todayGlow: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 13,
    backgroundColor: '#3B82F6',
    opacity: 0.12,
  },
  todayCell: {
    borderWidth: 2.5,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  selectedCell: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pressedCell: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },

  // Note Indicator - Top Left
  noteIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },

  // Lock Indicator - Top Right
  lockIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 10,
    alignItems: 'center',
  },
  lockBody: {
    position: 'absolute',
    bottom: 0,
    width: 8,
    height: 5,
    backgroundColor: '#9CA3AF',
    borderRadius: 1.5,
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 5,
    height: 4,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: '#9CA3AF',
    borderTopLeftRadius: 2.5,
    borderTopRightRadius: 2.5,
  },

  // Day Number
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  todayNumber: {
    color: '#2563EB',
    fontWeight: '700',
  },
  emptyDayNumber: {
    opacity: 0.5,
  },

  // Shift Label - compact to prevent overflow
  shiftLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 28,
    maxWidth: '90%',
    alignItems: 'center',
  },
  shiftText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },

  // Empty State
  emptyShiftPlaceholder: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  emptyLine: {
    width: 12,
    height: 2,
    borderRadius: 1,
    opacity: 0.4,
  },
});
