/**
 * Repository Interface
 *
 * This abstraction layer allows us to swap storage implementations:
 * - V1: MMKV (fast, simple)
 * - Future: SQLite if queries become complex
 *
 * The app code uses this interface, not MMKV directly.
 */

import type {
  ShiftType,
  ProgramTemplate,
  PlannedDay,
  AppSettings,
} from '../types';

export interface IScheduleRepository {
  // ============================================
  // PLANNED DAYS
  // ============================================

  /**
   * Get a single planned day by date
   */
  getPlannedDay(date: string): PlannedDay | null;

  /**
   * Get all planned days
   */
  getAllPlannedDays(): Record<string, PlannedDay>;

  /**
   * Get planned days in a date range (inclusive)
   */
  getPlannedDaysInRange(startDate: string, endDate: string): PlannedDay[];

  /**
   * Get planned days for a month
   */
  getPlannedDaysByMonth(year: number, month: number): PlannedDay[];

  /**
   * Save a single planned day
   */
  setPlannedDay(day: PlannedDay): void;

  /**
   * Save multiple planned days
   */
  setPlannedDays(days: PlannedDay[]): void;

  /**
   * Delete a planned day
   */
  deletePlannedDay(date: string): void;

  /**
   * Lock a planned day
   */
  lockPlannedDay(date: string): void;

  /**
   * Unlock a planned day
   */
  unlockPlannedDay(date: string): void;

  // ============================================
  // SHIFT TYPES
  // ============================================

  /**
   * Get all shift types
   */
  getShiftTypes(): ShiftType[];

  /**
   * Get a shift type by code
   */
  getShiftTypeByCode(code: string): ShiftType | null;

  /**
   * Save a shift type
   */
  setShiftType(shiftType: ShiftType): void;

  /**
   * Delete a shift type
   */
  deleteShiftType(id: string): void;

  // ============================================
  // TEMPLATES
  // ============================================

  /**
   * Get all templates
   */
  getTemplates(): ProgramTemplate[];

  /**
   * Get active template
   */
  getActiveTemplate(): ProgramTemplate | null;

  /**
   * Get a template by ID
   */
  getTemplateById(id: string): ProgramTemplate | null;

  /**
   * Save a template
   */
  setTemplate(template: ProgramTemplate): void;

  /**
   * Delete a template
   */
  deleteTemplate(id: string): void;

  /**
   * Set active template
   */
  setActiveTemplate(templateId: string): void;

  // ============================================
  // SETTINGS
  // ============================================

  /**
   * Get app settings
   */
  getSettings(): AppSettings;

  /**
   * Update app settings
   */
  setSettings(settings: Partial<AppSettings>): void;

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  /**
   * Export all data as JSON string
   */
  exportAllData(): string;

  /**
   * Clear all data
   */
  clearAllData(): void;

  /**
   * Initialize with default data if empty
   */
  initializeDefaults(): void;
}

/**
 * Storage data structure (for serialization)
 */
export interface StorageData {
  shiftTypes: ShiftType[];
  templates: ProgramTemplate[];
  plannedDays: Record<string, PlannedDay>;
  settings: AppSettings;
  version: number; // For future migrations
}
