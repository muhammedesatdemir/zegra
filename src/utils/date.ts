/**
 * Date Utilities
 *
 * All date operations use date-fns with Turkish locale.
 * Dates are stored as ISO strings (YYYY-MM-DD).
 */

import {
  format,
  parse,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDaysInMonth,
  isValid,
  getYear,
  getMonth,
  getDate,
} from 'date-fns';
import { tr } from 'date-fns/locale';

// ============================================
// DATE FORMAT CONSTANTS
// ============================================

export const ISO_DATE_FORMAT = 'yyyy-MM-dd';

// ============================================
// PARSING & FORMATTING
// ============================================

/**
 * Format Date to ISO string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return format(date, ISO_DATE_FORMAT);
}

/**
 * Parse ISO date string to Date object
 */
export function parseISODate(dateStr: string): Date {
  const parsed = parse(dateStr, ISO_DATE_FORMAT, new Date());
  if (!isValid(parsed)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return parsed;
}

/**
 * Validate ISO date string format
 */
export function isValidISODate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  try {
    const parsed = parseISODate(dateStr);
    return isValid(parsed);
  } catch {
    return false;
  }
}

// ============================================
// TURKISH FORMATTING
// ============================================

/**
 * Format date in Turkish: "22 Mart 2026, Pazar"
 */
export function formatDateTR(date: Date): string {
  return format(date, 'd MMMM yyyy, EEEE', { locale: tr });
}

/**
 * Format date short in Turkish: "22 Mart"
 */
export function formatDateShortTR(date: Date): string {
  return format(date, 'd MMMM', { locale: tr });
}

/**
 * Format month and year in Turkish: "Mart 2026"
 */
export function formatMonthYearTR(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: tr });
}

/**
 * Format weekday in Turkish: "Pazar"
 */
export function formatWeekdayTR(date: Date): string {
  return format(date, 'EEEE', { locale: tr });
}

// ============================================
// DATE CALCULATIONS
// ============================================

/**
 * Get all days in a month as ISO strings
 */
export function getDaysInMonthRange(year: number, month: number): string[] {
  const start = new Date(year, month - 1, 1);
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  return days.map(toISODateString);
}

/**
 * Get all days in a date range as ISO strings
 * Returns empty array if end is before start
 */
export function getDaysInRange(startDate: string, endDate: string): string[] {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  // Handle invalid range (end before start)
  if (end < start) {
    return [];
  }

  const days = eachDayOfInterval({ start, end });
  return days.map(toISODateString);
}

/**
 * Get the last day of a month as ISO string
 */
export function getLastDayOfMonth(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return toISODateString(endOfMonth(date));
}

/**
 * Get the first day of a month as ISO string
 */
export function getFirstDayOfMonth(year: number, month: number): string {
  return toISODateString(new Date(year, month - 1, 1));
}

/**
 * Get number of days in a month
 */
export function getDayCount(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1, 1));
}

/**
 * Get previous month's last day as ISO string
 */
export function getPreviousMonthLastDay(year: number, month: number): string {
  const firstDay = new Date(year, month - 1, 1);
  const prevDay = subDays(firstDay, 1);
  return toISODateString(prevDay);
}

/**
 * Add days to an ISO date string
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const date = parseISODate(dateStr);
  return toISODateString(addDays(date, days));
}

/**
 * Extract year, month, day from ISO date string
 */
export function extractDateParts(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  const date = parseISODate(dateStr);
  return {
    year: getYear(date),
    month: getMonth(date) + 1, // 1-indexed
    day: getDate(date),
  };
}

// ============================================
// TODAY
// ============================================

/**
 * Get today's date as ISO string
 */
export function getTodayISO(): string {
  return toISODateString(new Date());
}

/**
 * Get current year and month
 */
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: getYear(now),
    month: getMonth(now) + 1, // 1-indexed
  };
}
