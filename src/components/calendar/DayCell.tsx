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
  isHoliday?: boolean;
  cellSize: number;
  onPress: () => void;
}

// FINAL COLOR SYSTEM — calendar uses a soft variant of each shift's identity
// color. Sabah is intentionally pushed into a stronger emerald tone so it
// reads as clearly "green" next to Off's slate, since users were confusing
// the two when sabah used the lighter mint shade.
const SHIFT_BG_COLORS = {
  S: '#BBF7D0',      // emerald-200 — stronger green for Sabah
  Ö: '#FED7AA',      // Soft orange for Öğle - TURKISH Ö CHARACTER
  G: '#DBEAFE',      // Soft blue for Gece
  Off: '#E2E8F0',    // slate-200 — different hue family, no green tint
} as const;

const SHIFT_TEXT_COLORS = {
  S: '#14532D',      // emerald-900 — strong contrast over BBF7D0
  Ö: '#C2410C',      // Dark orange - TURKISH Ö CHARACTER
  G: '#1D4ED8',      // Dark blue
  Off: '#475569',    // slate-600
} as const;

type ShiftColorKey = keyof typeof SHIFT_BG_COLORS;

// Get colors - prefer shift type's native color, fallback to our premium palette
function getShiftColors(
  shiftType: ShiftType | null
): { bg: string; text: string } {
  if (!shiftType) {
    return { bg: '#F9FAFB', text: '#9CA3AF' };
  }

  const shortName = shiftType.shortName;

  // Check our premium color palette first (handles S, Ö, G, Off)
  if (shortName && shortName in SHIFT_BG_COLORS) {
    const key = shortName as ShiftColorKey;
    return {
      bg: SHIFT_BG_COLORS[key],
      text: SHIFT_TEXT_COLORS[key],
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
  isHoliday,
  cellSize,
  onPress,
}: DayCellProps) {
  const { colors, isDark } = useTheme();

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
            <View
              style={[
                styles.noteDot,
                isDark
                  ? { width: 7, height: 7, borderRadius: 3.5, borderWidth: 1, borderColor: '#0F172A' }
                  : { width: 8, height: 8, borderRadius: 4 },
              ]}
            />
          </View>
        )}

        {/* Lock Indicator - Top Right */}
        {isLocked && (
          <View style={styles.lockIndicator}>
            <View
              style={[
                styles.lockBody,
                { backgroundColor: '#334155' },
              ]}
            />
            <View
              style={[
                styles.lockShackle,
                { borderColor: '#334155' },
              ]}
            />
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

        {/* Holiday underline — sits just below the day number, intentionally
            subtle so it never competes with shift colors or the today border. */}
        {isHoliday && (
          <View
            style={[
              styles.holidayUnderline,
              { backgroundColor: isDark ? '#F87171' : '#DC2626' },
            ]}
          />
        )}

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
    backgroundColor: '#8B5CF6',
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
    borderRadius: 1.5,
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 5,
    height: 4,
    borderWidth: 1.5,
    borderBottomWidth: 0,
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
  holidayUnderline: {
    width: 14,
    height: 2,
    borderRadius: 1,
    marginTop: -2,
    marginBottom: 3,
    opacity: 0.9,
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
