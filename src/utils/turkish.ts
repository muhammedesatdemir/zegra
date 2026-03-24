/**
 * Turkish String Utilities
 *
 * JavaScript's default toUpperCase/toLowerCase does NOT work correctly for Turkish.
 * These utilities ensure proper handling of Turkish characters:
 *
 * ı → I (dotless i to capital I)
 * I → ı (capital I to dotless i)
 * i → İ (dotted i to capital İ)
 * İ → i (capital İ to dotted i)
 *
 * Also handles: ç/Ç, ğ/Ğ, ö/Ö, ş/Ş, ü/Ü
 */

const TR_LOCALE = 'tr-TR';

/**
 * Convert string to uppercase using Turkish locale rules
 */
export function toUpperTR(str: string): string {
  return str.toLocaleUpperCase(TR_LOCALE);
}

/**
 * Convert string to lowercase using Turkish locale rules
 */
export function toLowerTR(str: string): string {
  return str.toLocaleLowerCase(TR_LOCALE);
}

/**
 * Compare two strings using Turkish locale collation
 */
export function compareTR(a: string, b: string): number {
  return a.localeCompare(b, TR_LOCALE);
}

/**
 * Check if string includes substring (case-insensitive, Turkish-aware)
 */
export function includesTR(haystack: string, needle: string): boolean {
  return toLowerTR(haystack).includes(toLowerTR(needle));
}

/**
 * Check if string starts with prefix (case-insensitive, Turkish-aware)
 */
export function startsWithTR(str: string, prefix: string): boolean {
  return toLowerTR(str).startsWith(toLowerTR(prefix));
}

/**
 * Turkish month names (1-indexed, index 0 is empty)
 */
export const TURKISH_MONTHS = [
  '',
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

/**
 * Turkish weekday names (0 = Sunday)
 */
export const TURKISH_WEEKDAYS = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const;

/**
 * Turkish weekday names (0 = Monday)
 */
export const TURKISH_WEEKDAYS_MONDAY_START = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
] as const;

/**
 * Get Turkish month name (1-12)
 */
export function getMonthNameTR(month: number): string {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  return TURKISH_MONTHS[month] ?? '';
}

/**
 * Get Turkish weekday name (0 = Sunday by default)
 */
export function getWeekdayNameTR(
  dayIndex: number,
  mondayStart: boolean = false
): string {
  if (mondayStart) {
    return TURKISH_WEEKDAYS_MONDAY_START[dayIndex] ?? '';
  }
  return TURKISH_WEEKDAYS[dayIndex] ?? '';
}
