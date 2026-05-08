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

/**
 * Parse HH:MM into { hours, minutes }. Returns null on invalid input.
 * Accepts "8:00", "08:00", "8.00" — anything that splits cleanly into
 * two numeric parts within valid ranges.
 */
export function parseHM(value: string): { hours: number; minutes: number } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Allow either ":" or "." as separator (TR keyboards often type ".")
  const parts = trimmed.split(/[.:]/);
  if (parts.length !== 2) return null;

  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return { hours: h, minutes: m };
}

/**
 * Validate that a string is a valid HH:MM time (00:00–23:59).
 */
export function isValidHM(value: string): boolean {
  return parseHM(value) !== null;
}

/**
 * Format two numeric values into a normalized "HH:MM" string.
 */
export function formatHM(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Decide whether a shift crosses midnight based on its start and end times.
 * If the end is at or before the start (in minutes), it's overnight.
 */
export function isOvernightFromHM(startTime: string, endTime: string): boolean {
  const start = parseHM(startTime);
  const end = parseHM(endTime);
  if (!start || !end) return false;
  const startMin = start.hours * 60 + start.minutes;
  const endMin = end.hours * 60 + end.minutes;
  return endMin <= startMin;
}
