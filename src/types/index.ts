/**
 * Vardiya Planı - Core Type Definitions
 */

// ============================================
// SHIFT TYPE
// ============================================

export interface ShiftType {
  id: string;
  code: string;              // "0715", "1523", "2307", "OFF", "OFF1", "OFF2"
  name: string;              // "Sabah", "Akşam", "Gece", "İzin"
  shortName: string;         // "S", "A", "G", "İ"
  color: string;             // "#22C55E"
  startTime: string | null;  // "07:00" or null for off days
  endTime: string | null;    // "15:00" or null for off days
  isWorking: boolean;
  isOvernight: boolean;      // true for shifts crossing midnight
  isEditable: boolean;       // can user modify this?
}

// ============================================
// PROGRAM TEMPLATE
// ============================================

export interface ProgramTemplate {
  id: string;
  name: string;              // "BYG-A1", "Kendi Programım"
  cycleLength: number;       // 8
  steps: string[];           // ["OFF1", "OFF2", "0715", "0715", ...]
  isActive: boolean;
  isDefault: boolean;        // system template
}

// ============================================
// PLANNED DAY
// ============================================

export type PlannedDaySource = 'generated' | 'manual' | 'revised';

export interface PlannedDay {
  date: string;              // "2026-03-22" (ISO format, unique key)
  shiftCode: string;         // "0715", "2307", "OFF1"
  isLocked: boolean;         // protected from auto operations
  source: PlannedDaySource;
  templateId: string | null; // which template generated this
  note: string | null;       // user note
  cycleIndex?: number;       // position in template cycle (0 to cycleLength-1), used for continuity
  customStartTime?: string;  // "08:00" - overrides shift's default start time for THIS day only
  customEndTime?: string;    // "16:00" - overrides shift's default end time for THIS day only
}

// ============================================
// APP SETTINGS
// ============================================

export interface AppSettings {
  activeTemplateId: string | null;
  weekStartsOnMonday: boolean;
  theme: 'light' | 'dark';
  showOffVariants: boolean;  // show OFF1/OFF2 separately in UI
  onboardingDone: boolean;
}

// ============================================
// GENERATION OPTIONS
// ============================================

export interface GenerateOptions {
  templateId: string;
  startDate: string;         // ISO date
  endDate: string;           // ISO date
  phaseOffset: number;
  preserveLocked: boolean;
  preserveManual: boolean;
}

export interface GenerateResult {
  success: boolean;
  daysGenerated: number;
  daysSkipped: number;
  errors: string[];
}

// ============================================
// REVISION OPTIONS
// ============================================

export interface RevisionOptions {
  startDate: string;
  endDate: string;
  mode: 'single_shift' | 'from_template';
  shiftCode?: string;        // when mode = 'single_shift'
  templateId?: string;       // when mode = 'from_template'
  phaseOffset?: number;      // when mode = 'from_template'
  overrideLocked: boolean;
  overrideManual: boolean;
}

// ============================================
// MONTHLY SUMMARY
// ============================================

export interface ShiftCount {
  shiftCode: string;
  shiftName: string;
  count: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalDays: number;
  workingDays: number;
  offDays: number;
  shiftCounts: ShiftCount[];
  overnightCount: number;
}
