/**
 * In-Memory Repository Implementation
 *
 * Simple in-memory storage for development and Expo Go.
 * Data persists only during app session.
 */

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

const CURRENT_VERSION = 1;

export class MemoryRepository implements IScheduleRepository {
  private shiftTypes: ShiftType[] = [...DEFAULT_SHIFT_TYPES];
  private templates: ProgramTemplate[] = [...DEFAULT_TEMPLATES];
  private plannedDays: Record<string, PlannedDay> = {};
  private settings: AppSettings = { ...DEFAULT_SETTINGS };

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
  }

  setPlannedDays(newDays: PlannedDay[]): void {
    for (const day of newDays) {
      this.plannedDays[day.date] = { ...day };
    }
  }

  deletePlannedDay(date: string): void {
    delete this.plannedDays[date];
  }

  lockPlannedDay(date: string): void {
    const day = this.plannedDays[date];
    if (day) {
      day.isLocked = true;
    }
  }

  unlockPlannedDay(date: string): void {
    const day = this.plannedDays[date];
    if (day) {
      day.isLocked = false;
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
  }

  deleteShiftType(id: string): void {
    this.shiftTypes = this.shiftTypes.filter((st) => st.id !== id);
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
  }

  deleteTemplate(id: string): void {
    this.templates = this.templates.filter((t) => t.id !== id);
    if (this.settings.activeTemplateId === id) {
      this.settings.activeTemplateId = null;
    }
  }

  setActiveTemplate(templateId: string): void {
    for (const template of this.templates) {
      template.isActive = template.id === templateId;
    }
    this.settings.activeTemplateId = templateId;
  }

  // ============================================
  // SETTINGS
  // ============================================

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  setSettings(partial: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...partial };
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
  }

  initializeDefaults(): void {
    if (this.shiftTypes.length === 0) {
      this.shiftTypes = [...DEFAULT_SHIFT_TYPES];
    }
    if (this.templates.length === 0) {
      this.templates = [...DEFAULT_TEMPLATES];
    }
    if (!this.settings.activeTemplateId && this.templates.length > 0) {
      const defaultActive = this.templates.find((t) => t.isActive);
      if (defaultActive) {
        this.settings.activeTemplateId = defaultActive.id;
      }
    }
  }
}

// Singleton instance
let repositoryInstance: MemoryRepository | null = null;

export function getRepository(): MemoryRepository {
  if (!repositoryInstance) {
    repositoryInstance = new MemoryRepository();
    repositoryInstance.initializeDefaults();
  }
  return repositoryInstance;
}

// For testing
export function createTestRepository(): MemoryRepository {
  return new MemoryRepository();
}
