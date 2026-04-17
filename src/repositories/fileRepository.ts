/**
 * File-Based Persistent Repository
 *
 * Uses expo-file-system v55 new API (File, Paths) for persistent local storage.
 * Fully synchronous — no async hydration needed.
 *
 * Strategy:
 * - On first access: sync read from file → populate in-memory cache
 * - On read: from in-memory cache (fast)
 * - On write: update cache + sync write to file
 * - External interface: IScheduleRepository (synchronous)
 *
 * Storage: Single JSON file at Paths.document/vardiya-plani-data.json
 */

import { File as ExpoFile, Paths } from 'expo-file-system';
import type {
  ShiftType,
  ProgramTemplate,
  PlannedDay,
  AppSettings,
} from '../types';
import type { IScheduleRepository, StorageData } from './types';
import {
  DEFAULT_SHIFT_TYPES,
  DEFAULT_TEMPLATES,
  DEFAULT_SETTINGS,
} from '../constants/shifts';
import { getDaysInRange, getDaysInMonthRange } from '../utils/date';

// ============================================
// CONSTANTS
// ============================================

const STORAGE_FILE = 'vardiya-plani-data.json';
const CURRENT_VERSION = 1;

function getStorageFile(): ExpoFile {
  return new ExpoFile(Paths.document, STORAGE_FILE);
}

// ============================================
// FILE REPOSITORY
// ============================================

export class FileRepository implements IScheduleRepository {
  // In-memory cache
  private shiftTypes: ShiftType[] = [...DEFAULT_SHIFT_TYPES];
  private templates: ProgramTemplate[] = [...DEFAULT_TEMPLATES];
  private plannedDays: Record<string, PlannedDay> = {};
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private isLoaded = false;

  // ============================================
  // LOAD — sync read from file on first access
  // ============================================

  /**
   * Load data from file into memory cache.
   * Called automatically on first repository access.
   * Uses synchronous file read (textSync) so no async needed.
   */
  load(): void {
    if (this.isLoaded) return;
    this.isLoaded = true;

    try {
      const file = getStorageFile();

      if (!file.exists) {
        return;
      }

      const raw = file.textSync();

      if (!raw || raw.length === 0) {
        return;
      }

      const data = JSON.parse(raw) as StorageData;

      if (data && typeof data === 'object') {
        if (Array.isArray(data.shiftTypes) && data.shiftTypes.length > 0) {
          this.shiftTypes = data.shiftTypes;
        }
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          this.templates = data.templates;
        }
        if (data.plannedDays && typeof data.plannedDays === 'object') {
          this.plannedDays = data.plannedDays;
        }
        if (data.settings && typeof data.settings === 'object') {
          this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Persist] Load failed, using defaults:', error);
      }
    }
  }

  // ============================================
  // SAVE — sync write to file
  // ============================================

  private save(): void {
    try {
      const file = getStorageFile();
      const data: StorageData = {
        shiftTypes: this.shiftTypes,
        templates: this.templates,
        plannedDays: this.plannedDays,
        settings: this.settings,
        version: CURRENT_VERSION,
      };

      const json = JSON.stringify(data);
      file.write(json);
    } catch (error) {
      if (__DEV__) {
        console.error('[Persist] Save failed:', error);
      }
    }
  }

  // ============================================
  // PLANNED DAYS
  // ============================================

  getPlannedDay(date: string): PlannedDay | null {
    return this.plannedDays[date] ?? null;
  }

  getAllPlannedDays(): Record<string, PlannedDay> {
    return { ...this.plannedDays };
  }

  getPlannedDaysInRange(startDate: string, endDate: string): PlannedDay[] {
    const dateRange = getDaysInRange(startDate, endDate);
    return dateRange
      .map((date) => this.plannedDays[date])
      .filter((day): day is PlannedDay => day !== undefined);
  }

  getPlannedDaysByMonth(year: number, month: number): PlannedDay[] {
    const dateRange = getDaysInMonthRange(year, month);
    return dateRange
      .map((date) => this.plannedDays[date])
      .filter((day): day is PlannedDay => day !== undefined);
  }

  setPlannedDay(day: PlannedDay): void {
    this.plannedDays[day.date] = { ...day };
    this.save();
  }

  setPlannedDays(newDays: PlannedDay[]): void {
    for (const day of newDays) {
      this.plannedDays[day.date] = { ...day };
    }
    this.save();
  }

  deletePlannedDay(date: string): void {
    delete this.plannedDays[date];
    this.save();
  }

  lockPlannedDay(date: string): void {
    const day = this.plannedDays[date];
    if (day) {
      day.isLocked = true;
      this.save();
    }
  }

  unlockPlannedDay(date: string): void {
    const day = this.plannedDays[date];
    if (day) {
      day.isLocked = false;
      this.save();
    }
  }

  // ============================================
  // SHIFT TYPES
  // ============================================

  getShiftTypes(): ShiftType[] {
    return [...this.shiftTypes];
  }

  getShiftTypeByCode(code: string): ShiftType | null {
    return this.shiftTypes.find((st) => st.code === code) ?? null;
  }

  setShiftType(shiftType: ShiftType): void {
    const index = this.shiftTypes.findIndex((st) => st.id === shiftType.id);
    if (index >= 0) {
      this.shiftTypes[index] = { ...shiftType };
    } else {
      this.shiftTypes.push({ ...shiftType });
    }
    this.save();
  }

  deleteShiftType(id: string): void {
    this.shiftTypes = this.shiftTypes.filter((st) => st.id !== id);
    this.save();
  }

  // ============================================
  // TEMPLATES
  // ============================================

  getTemplates(): ProgramTemplate[] {
    return [...this.templates];
  }

  getActiveTemplate(): ProgramTemplate | null {
    if (!this.settings.activeTemplateId) return null;
    return this.getTemplateById(this.settings.activeTemplateId);
  }

  getTemplateById(id: string): ProgramTemplate | null {
    return this.templates.find((t) => t.id === id) ?? null;
  }

  setTemplate(template: ProgramTemplate): void {
    const index = this.templates.findIndex((t) => t.id === template.id);
    if (index >= 0) {
      this.templates[index] = { ...template };
    } else {
      this.templates.push({ ...template });
    }
    this.save();
  }

  deleteTemplate(id: string): void {
    this.templates = this.templates.filter((t) => t.id !== id);
    if (this.settings.activeTemplateId === id) {
      this.settings.activeTemplateId = null;
    }
    this.save();
  }

  setActiveTemplate(templateId: string): void {
    for (const template of this.templates) {
      template.isActive = template.id === templateId;
    }
    this.settings.activeTemplateId = templateId;
    this.save();
  }

  // ============================================
  // SETTINGS
  // ============================================

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  setSettings(partial: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.save();
  }

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  exportAllData(): string {
    const data: StorageData = {
      shiftTypes: this.shiftTypes,
      templates: this.templates,
      plannedDays: this.plannedDays,
      settings: this.settings,
      version: CURRENT_VERSION,
    };
    return JSON.stringify(data, null, 2);
  }

  clearAllData(): void {
    this.shiftTypes = [];
    this.templates = [];
    this.plannedDays = {};
    this.settings = { ...DEFAULT_SETTINGS };
    this.save();
  }

  initializeDefaults(): void {
    let changed = false;

    if (this.shiftTypes.length === 0) {
      this.shiftTypes = [...DEFAULT_SHIFT_TYPES];
      changed = true;
    }
    if (this.templates.length === 0) {
      this.templates = [...DEFAULT_TEMPLATES];
      changed = true;
    }

    if (changed && !this.settings.activeTemplateId && this.templates.length > 0) {
      const defaultActive = this.templates.find((t) => t.isActive);
      if (defaultActive) {
        this.settings.activeTemplateId = defaultActive.id;
      }
    }

    if (changed) {
      this.save();
    }
  }
}

// ============================================
// SINGLETON — survives Metro hot reload
// ============================================

const GLOBAL_KEY = '__vardiya_plani_repo__';

function getGlobal(): Record<string, unknown> {
  return (typeof globalThis !== 'undefined' ? globalThis : global) as unknown as Record<string, unknown>;
}

export function getFileRepository(): FileRepository {
  const g = getGlobal();
  if (!g[GLOBAL_KEY]) {
    const repo = new FileRepository();
    repo.load(); // Sync load from disk — instant
    repo.initializeDefaults();
    g[GLOBAL_KEY] = repo;
  }
  return g[GLOBAL_KEY] as FileRepository;
}
