/**
 * Schedule Store
 *
 * Main state management for the app.
 * Uses Zustand for simplicity and performance.
 */

import { create } from 'zustand';
import type {
  ShiftType,
  ProgramTemplate,
  PlannedDay,
  AppSettings,
  RevisionOptions,
} from '../types';
import { getRepository } from '../repositories';
import {
  generateDays,
  calculatePhaseForNewMonth,
  reviseRange,
  previewGeneration,
  previewRevision,
} from '../services/schedulingEngine';
import { getTodayISO, getCurrentYearMonth, getPreviousMonthLastDay } from '../utils/date';
import { mark as startupMark } from '../utils/startupTimer';

// ============================================
// STATE TYPES
// ============================================

interface ScheduleState {
  // Data
  shiftTypes: ShiftType[];
  templates: ProgramTemplate[];
  plannedDays: Record<string, PlannedDay>;
  settings: AppSettings;

  // UI State
  selectedDate: string;
  viewYear: number;
  viewMonth: number;
  isLoading: boolean;

  // Actions - Data Loading
  loadAllData: () => void;

  // Actions - Planned Days
  getPlannedDay: (date: string) => PlannedDay | null;
  setPlannedDay: (day: PlannedDay) => void;
  lockDay: (date: string) => void;
  unlockDay: (date: string) => void;
  deleteDay: (date: string) => void;

  // Actions - Generation
  generateMonth: (
    year: number,
    month: number,
    options?: {
      preserveLocked?: boolean;
      preserveManual?: boolean;
      startDay?: number;
    }
  ) => { generated: number; skipped: number };

  // Actions - Revision
  reviseRange: (options: RevisionOptions) => { revised: number; skipped: number };

  // Actions - Templates
  setActiveTemplate: (templateId: string) => void;
  addTemplate: (template: Omit<ProgramTemplate, 'id'>) => void;
  updateTemplate: (templateId: string, updates: Partial<ProgramTemplate>) => void;
  saveTemplate: (template: ProgramTemplate) => void;
  deleteTemplate: (templateId: string) => void;

  // Actions - Shift Types
  saveShiftType: (shiftType: ShiftType) => void;
  deleteShiftType: (id: string) => void;

  // Actions - Settings
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Actions - UI
  setSelectedDate: (date: string) => void;
  setViewMonth: (year: number, month: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;

  // Actions - Data Management
  exportData: () => string;
  clearAllData: () => void;
}

// ============================================
// STORE CREATION
// ============================================

// Hydrate synchronously at module load so the first render already has data.
// Repository is a singleton with sync disk read (file.textSync) — safe to run eagerly.
startupMark('store hydrate: begin (repo init + sync file read)');
const initialRepo = getRepository();
const initialShiftTypes = initialRepo.getShiftTypes();
const initialTemplates = initialRepo.getTemplates();
const initialPlannedDays = initialRepo.getAllPlannedDays();
const initialSettings = initialRepo.getSettings();
startupMark(
  `store hydrate: done (${initialShiftTypes.length} shifts, ` +
    `${initialTemplates.length} templates, ` +
    `${Object.keys(initialPlannedDays).length} planned days)`,
);

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // Initial state — already hydrated from disk
  shiftTypes: initialShiftTypes,
  templates: initialTemplates,
  plannedDays: initialPlannedDays,
  settings: initialSettings,
  selectedDate: getTodayISO(),
  viewYear: getCurrentYearMonth().year,
  viewMonth: getCurrentYearMonth().month,
  isLoading: false,

  // ============================================
  // DATA LOADING
  // ============================================

  loadAllData: () => {
    // No-op after module-load hydration; kept for callers that re-sync (e.g. clearAllData).
    const repo = getRepository();
    set({
      shiftTypes: repo.getShiftTypes(),
      templates: repo.getTemplates(),
      plannedDays: repo.getAllPlannedDays(),
      settings: repo.getSettings(),
      isLoading: false,
    });
  },

  // ============================================
  // PLANNED DAYS
  // ============================================

  getPlannedDay: (date: string) => {
    return get().plannedDays[date] ?? null;
  },

  setPlannedDay: (day: PlannedDay) => {
    const repo = getRepository();
    repo.setPlannedDay(day);

    set((state) => ({
      plannedDays: {
        ...state.plannedDays,
        [day.date]: day,
      },
    }));
  },

  lockDay: (date: string) => {
    const day = get().plannedDays[date];
    if (day) {
      const updated = { ...day, isLocked: true };
      get().setPlannedDay(updated);
    }
  },

  unlockDay: (date: string) => {
    const day = get().plannedDays[date];
    if (day) {
      const updated = { ...day, isLocked: false };
      get().setPlannedDay(updated);
    }
  },

  deleteDay: (date: string) => {
    const repo = getRepository();
    repo.deletePlannedDay(date);

    set((state) => {
      const newDays = { ...state.plannedDays };
      delete newDays[date];
      return { plannedDays: newDays };
    });
  },

  // ============================================
  // GENERATION
  // ============================================

  generateMonth: (year, month, options = {}) => {
    const {
      preserveLocked = true,
      preserveManual = true,
      startDay = 1,
    } = options;
    const state = get();
    const repo = getRepository();

    // Get active template
    const activeTemplate = state.templates.find(
      (t) => t.id === state.settings.activeTemplateId
    );

    if (!activeTemplate) {
      return { generated: 0, skipped: 0 };
    }

    // Calculate phase offset
    let phaseOffset = 0;

    if (startDay > 1) {
      // "Bugünden" modu: Yeni şablon her zaman index 0'dan başlar
      // Önceki günün cycleIndex'i eski şablona ait olabilir, bu yüzden kullanmıyoruz
      // Kullanıcı yeni şablon seçip "Bugünden" dediğinde, şablonun başından başlamak istiyor
      phaseOffset = 0;
    } else {
      // Starting from day 1, look at last day of previous month.
      // Use local-date based ISO string — toISOString() uses UTC and
      // shifts the date by the timezone offset (breaks cycle continuity in TR).
      const prevDateStr = getPreviousMonthLastDay(year, month);
      const prevDay = state.plannedDays[prevDateStr];
      phaseOffset = calculatePhaseForNewMonth(
        activeTemplate,
        prevDay?.shiftCode ?? null,
        prevDay?.cycleIndex // Pass the exact cycle index for accurate continuity
      );
    }

    // Calculate date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Generate days
    const newDays = generateDays(
      activeTemplate,
      {
        templateId: activeTemplate.id,
        startDate,
        endDate,
        phaseOffset,
        preserveLocked,
        preserveManual,
      },
      state.plannedDays,
      state.shiftTypes
    );

    // Save to repository
    repo.setPlannedDays(newDays);

    // Update state
    const updatedDays = { ...state.plannedDays };
    for (const day of newDays) {
      updatedDays[day.date] = day;
    }
    set({ plannedDays: updatedDays });

    // Calculate preview for stats
    const preview = previewGeneration(
      {
        templateId: activeTemplate.id,
        startDate,
        endDate,
        phaseOffset,
        preserveLocked,
        preserveManual,
      },
      state.plannedDays
    );

    return {
      generated: newDays.length,
      skipped: preview.totalDays - newDays.length,
    };
  },

  // ============================================
  // REVISION
  // ============================================

  reviseRange: (options: RevisionOptions) => {
    const state = get();
    const repo = getRepository();

    const revisedDays = reviseRange(
      options,
      state.plannedDays,
      state.templates,
      state.shiftTypes
    );

    // Save to repository
    repo.setPlannedDays(revisedDays);

    // Update state
    const updatedDays = { ...state.plannedDays };
    for (const day of revisedDays) {
      updatedDays[day.date] = day;
    }
    set({ plannedDays: updatedDays });

    const preview = previewRevision(options, state.plannedDays);

    return {
      revised: revisedDays.length,
      skipped: preview.totalDays - revisedDays.length,
    };
  },

  // ============================================
  // TEMPLATES
  // ============================================

  setActiveTemplate: (templateId: string) => {
    const repo = getRepository();
    repo.setActiveTemplate(templateId);

    set((state) => ({
      templates: state.templates.map((t) => ({
        ...t,
        isActive: t.id === templateId,
      })),
      settings: {
        ...state.settings,
        activeTemplateId: templateId,
      },
    }));
  },

  addTemplate: (templateData: Omit<ProgramTemplate, 'id'>) => {
    const template: ProgramTemplate = {
      ...templateData,
      id: `template_${Date.now()}`,
    };
    get().saveTemplate(template);
  },

  updateTemplate: (templateId: string, updates: Partial<ProgramTemplate>) => {
    const state = get();
    const existing = state.templates.find((t) => t.id === templateId);
    if (existing) {
      get().saveTemplate({ ...existing, ...updates });
    }
  },

  saveTemplate: (template: ProgramTemplate) => {
    const repo = getRepository();
    repo.setTemplate(template);

    set((state) => {
      const index = state.templates.findIndex((t) => t.id === template.id);
      const newTemplates = [...state.templates];

      if (index >= 0) {
        newTemplates[index] = template;
      } else {
        newTemplates.push(template);
      }

      return { templates: newTemplates };
    });
  },

  deleteTemplate: (templateId: string) => {
    const repo = getRepository();
    repo.deleteTemplate(templateId);

    set((state) => ({
      templates: state.templates.filter((t) => t.id !== templateId),
      settings:
        state.settings.activeTemplateId === templateId
          ? { ...state.settings, activeTemplateId: null }
          : state.settings,
    }));
  },

  // ============================================
  // SHIFT TYPES
  // ============================================

  saveShiftType: (shiftType: ShiftType) => {
    const repo = getRepository();
    repo.setShiftType(shiftType);

    set((state) => {
      const index = state.shiftTypes.findIndex((st) => st.id === shiftType.id);
      const newShiftTypes = [...state.shiftTypes];

      if (index >= 0) {
        newShiftTypes[index] = shiftType;
      } else {
        newShiftTypes.push(shiftType);
      }

      return { shiftTypes: newShiftTypes };
    });
  },

  deleteShiftType: (id: string) => {
    const repo = getRepository();
    repo.deleteShiftType(id);

    set((state) => ({
      shiftTypes: state.shiftTypes.filter((st) => st.id !== id),
    }));
  },

  // ============================================
  // SETTINGS
  // ============================================

  updateSettings: (partial: Partial<AppSettings>) => {
    const repo = getRepository();
    repo.setSettings(partial);

    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },

  // ============================================
  // UI NAVIGATION
  // ============================================

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  setViewMonth: (year: number, month: number) => {
    set({ viewYear: year, viewMonth: month });
  },

  goToPreviousMonth: () => {
    set((state) => {
      let newMonth = state.viewMonth - 1;
      let newYear = state.viewYear;

      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }

      return { viewMonth: newMonth, viewYear: newYear };
    });
  },

  goToNextMonth: () => {
    set((state) => {
      let newMonth = state.viewMonth + 1;
      let newYear = state.viewYear;

      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }

      return { viewMonth: newMonth, viewYear: newYear };
    });
  },

  goToToday: () => {
    const { year, month } = getCurrentYearMonth();
    set({
      selectedDate: getTodayISO(),
      viewYear: year,
      viewMonth: month,
    });
  },

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  exportData: () => {
    const repo = getRepository();
    return repo.exportAllData();
  },

  clearAllData: () => {
    const repo = getRepository();
    repo.clearAllData();
    repo.initializeDefaults();

    // Reload state
    get().loadAllData();
  },
}));

// ============================================
// SELECTORS
// ============================================

/**
 * Get today's planned shift
 */
export const selectTodayShift = (state: ScheduleState): PlannedDay | null => {
  const today = getTodayISO();
  return state.plannedDays[today] ?? null;
};

/**
 * Get active template
 */
export const selectActiveTemplate = (
  state: ScheduleState
): ProgramTemplate | null => {
  return (
    state.templates.find((t) => t.id === state.settings.activeTemplateId) ??
    null
  );
};

/**
 * Get shift type by code
 */
export const selectShiftType = (
  state: ScheduleState,
  code: string
): ShiftType | null => {
  return state.shiftTypes.find((st) => st.code === code) ?? null;
};

/**
 * Get days for current view month
 */
export const selectViewMonthDays = (state: ScheduleState): PlannedDay[] => {
  const { viewYear, viewMonth, plannedDays } = state;
  const days: PlannedDay[] = [];

  const lastDay = new Date(viewYear, viewMonth, 0).getDate();

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const day = plannedDays[dateStr];
    if (day) {
      days.push(day);
    }
  }

  return days;
};
