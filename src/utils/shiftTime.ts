/**
 * Shift Time Utilities
 *
 * Helper functions for calculating effective shift times.
 * Handles custom time overrides per day.
 */

import type { PlannedDay, ShiftType } from '../types';

export interface EffectiveTime {
  startTime: string | null;
  endTime: string | null;
  isCustom: boolean;
}

/**
 * Get effective shift time for a planned day.
 * Uses custom times if set, otherwise falls back to shift defaults.
 *
 * @param plannedDay - The planned day (may have custom times)
 * @param shiftType - The shift type with default times
 * @returns Effective start/end times and whether they're custom
 */
export function getEffectiveShiftTime(
  plannedDay: PlannedDay | null,
  shiftType: ShiftType | null
): EffectiveTime {
  if (!shiftType) {
    return { startTime: null, endTime: null, isCustom: false };
  }

  const customStart = plannedDay?.customStartTime;
  const customEnd = plannedDay?.customEndTime;

  const startTime = customStart || shiftType.startTime;
  const endTime = customEnd || shiftType.endTime;

  // Check if either time is custom (different from default)
  const isCustom = Boolean(
    (customStart && customStart !== shiftType.startTime) ||
    (customEnd && customEnd !== shiftType.endTime)
  );

  return { startTime, endTime, isCustom };
}

/**
 * Check if custom times are different from defaults.
 * If they're the same, we shouldn't store them.
 *
 * @param customStart - Custom start time
 * @param customEnd - Custom end time
 * @param shiftType - Shift type with defaults
 * @returns Whether the custom times are actually different
 */
export function hasCustomTime(
  customStart: string | undefined,
  customEnd: string | undefined,
  shiftType: ShiftType | null
): boolean {
  if (!shiftType) return false;

  const startDifferent = customStart && customStart !== shiftType.startTime;
  const endDifferent = customEnd && customEnd !== shiftType.endTime;

  return Boolean(startDifferent || endDifferent);
}

/**
 * Normalize custom times - return undefined if same as default.
 * This prevents storing redundant data.
 */
export function normalizeCustomTime(
  customTime: string | undefined,
  defaultTime: string | null
): string | undefined {
  if (!customTime || customTime.trim() === '') return undefined;
  if (customTime === defaultTime) return undefined;
  return customTime;
}
