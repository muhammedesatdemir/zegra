/**
 * Scheduling Engine
 *
 * This is the CORE of the application.
 * All schedule generation logic lives here.
 *
 * CRITICAL RULES:
 * 1. Overnight shifts belong to the START date (domain rule, not UI preference)
 * 2. Locked days are NEVER modified by auto operations
 * 3. Manual days are preserved by default
 * 4. Month continuity is maintained via phase calculation
 */

import type {
  PlannedDay,
  ProgramTemplate,
  GenerateOptions,
  GenerateResult,
  RevisionOptions,
  ShiftType,
} from '../types';
import { getDaysInRange, getPreviousMonthLastDay } from '../utils/date';

// ============================================
// GENERATE DAYS
// ============================================

/**
 * Generate planned days for a date range using a template.
 *
 * @param template - The program template to use
 * @param options - Generation options
 * @param existingDays - Current planned days (keyed by date)
 * @param shiftTypes - Available shift types for validation
 * @returns Array of new PlannedDay objects
 */
export function generateDays(
  template: ProgramTemplate,
  options: GenerateOptions,
  existingDays: Record<string, PlannedDay>,
  shiftTypes: ShiftType[]
): PlannedDay[] {
  const {
    startDate,
    endDate,
    phaseOffset,
    preserveLocked,
    preserveManual,
  } = options;

  const dates = getDaysInRange(startDate, endDate);
  const result: PlannedDay[] = [];

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    if (!dateStr) continue;

    const existing = existingDays[dateStr];

    // Protection checks
    if (existing) {
      if (preserveLocked && existing.isLocked) {
        continue; // Skip locked days
      }
      if (preserveManual && existing.source === 'manual') {
        continue; // Skip manual days
      }
    }

    // Calculate cycle position
    const cycleIndex = (phaseOffset + i) % template.cycleLength;
    const shiftCode = template.steps[cycleIndex];

    if (!shiftCode) {
      continue; // Invalid template step
    }

    // Validate shift code exists
    const shiftExists = shiftTypes.some((st) => st.code === shiftCode);
    if (!shiftExists) {
      continue; // Skip invalid shift codes
    }

    result.push({
      date: dateStr,
      shiftCode,
      isLocked: false,
      source: 'generated',
      templateId: template.id,
      note: null,
      cycleIndex, // Save cycle position for continuity across months
    });
  }

  return result;
}

/**
 * Generate days and return a result object with statistics
 */
export function generateSchedule(
  template: ProgramTemplate,
  options: GenerateOptions,
  existingDays: Record<string, PlannedDay>,
  shiftTypes: ShiftType[]
): GenerateResult {
  try {
    const dates = getDaysInRange(options.startDate, options.endDate);
    const generated = generateDays(template, options, existingDays, shiftTypes);

    const skipped = dates.length - generated.length;

    return {
      success: true,
      daysGenerated: generated.length,
      daysSkipped: skipped,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      daysGenerated: 0,
      daysSkipped: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================
// PHASE CALCULATION
// ============================================

/**
 * Calculate the phase offset for a new month based on the last day of the previous month.
 *
 * This ensures month continuity - the cycle continues seamlessly across month boundaries.
 *
 * IMPORTANT: We now use cycleIndex from the previous day for accurate continuity.
 * The old approach of using lastIndexOf(shiftCode) was broken because the same
 * shift code can appear multiple times in a template (e.g., G at index 7 and 23).
 *
 * @param template - The program template
 * @param lastDayShiftCode - The shift code of the last day of previous month (fallback only)
 * @param lastDayCycleIndex - The exact cycle index of the last day (preferred)
 * @returns Phase offset (0 to cycleLength-1)
 */
export function calculatePhaseForNewMonth(
  template: ProgramTemplate,
  lastDayShiftCode: string | null,
  lastDayCycleIndex?: number
): number {
  // If we have the exact cycle index, use it (this is the correct approach)
  if (lastDayCycleIndex !== undefined && lastDayCycleIndex >= 0) {
    return (lastDayCycleIndex + 1) % template.cycleLength;
  }

  // Fallback: no previous data, start from beginning
  if (!lastDayShiftCode) {
    return 0;
  }

  // Legacy fallback: try to guess from shift code (unreliable for templates with duplicate shifts)
  // This should rarely be used now that we save cycleIndex
  const lastIndex = template.steps.lastIndexOf(lastDayShiftCode);

  if (lastIndex === -1) {
    return 0; // Shift code not in template, start from beginning
  }

  // Next day continues from the next step in the cycle
  return (lastIndex + 1) % template.cycleLength;
}

/**
 * Calculate phase offset to align a specific date with a specific shift.
 *
 * Used during onboarding: "Today is Sabah" → calculate the offset so today shows Sabah
 *
 * @param template - The program template
 * @param targetShiftCode - The shift code that should appear on target date
 * @param daysSinceStart - Days from the start of generation to the target date
 * @returns Phase offset
 */
export function calculatePhaseForAlignment(
  template: ProgramTemplate,
  targetShiftCode: string,
  daysSinceStart: number = 0
): number {
  const targetIndex = template.steps.indexOf(targetShiftCode);

  if (targetIndex === -1) {
    return 0; // Shift not in template
  }

  // We want: (phaseOffset + daysSinceStart) % cycleLength === targetIndex
  // So: phaseOffset = (targetIndex - daysSinceStart) % cycleLength
  let offset = (targetIndex - daysSinceStart) % template.cycleLength;

  // Ensure positive
  if (offset < 0) {
    offset += template.cycleLength;
  }

  return offset;
}

// ============================================
// RANGE REVISION
// ============================================

/**
 * Revise a date range with new shift values.
 *
 * @param options - Revision options
 * @param existingDays - Current planned days
 * @param templates - Available templates (for 'from_template' mode)
 * @param shiftTypes - Available shift types
 * @returns Array of revised PlannedDay objects
 */
export function reviseRange(
  options: RevisionOptions,
  existingDays: Record<string, PlannedDay>,
  templates: ProgramTemplate[],
  shiftTypes: ShiftType[]
): PlannedDay[] {
  const {
    startDate,
    endDate,
    mode,
    shiftCode,
    templateId,
    phaseOffset = 0,
    overrideLocked,
    overrideManual,
  } = options;

  const dates = getDaysInRange(startDate, endDate);
  const result: PlannedDay[] = [];

  if (mode === 'single_shift') {
    // Fill entire range with a single shift
    if (!shiftCode) {
      return [];
    }

    // Validate shift code
    const shiftExists = shiftTypes.some((st) => st.code === shiftCode);
    if (!shiftExists) {
      return [];
    }

    for (const dateStr of dates) {
      if (!dateStr) continue;

      const existing = existingDays[dateStr];

      // Protection checks
      if (existing) {
        if (!overrideLocked && existing.isLocked) {
          continue;
        }
        if (!overrideManual && existing.source === 'manual') {
          continue;
        }
      }

      result.push({
        date: dateStr,
        shiftCode,
        isLocked: false,
        source: 'revised',
        templateId: null,
        note: existing?.note ?? null, // Preserve existing note
      });
    }
  } else if (mode === 'from_template') {
    // Regenerate from template
    if (!templateId) {
      return [];
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      return [];
    }

    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      if (!dateStr) continue;

      const existing = existingDays[dateStr];

      // Protection checks
      if (existing) {
        if (!overrideLocked && existing.isLocked) {
          continue;
        }
        if (!overrideManual && existing.source === 'manual') {
          continue;
        }
      }

      const cycleIndex = (phaseOffset + i) % template.cycleLength;
      const newShiftCode = template.steps[cycleIndex];

      if (!newShiftCode) continue;

      const shiftExists = shiftTypes.some((st) => st.code === newShiftCode);
      if (!shiftExists) continue;

      result.push({
        date: dateStr,
        shiftCode: newShiftCode,
        isLocked: false,
        source: 'revised',
        templateId: template.id,
        note: existing?.note ?? null,
        cycleIndex, // Save cycle position for continuity
      });
    }
  }

  return result;
}

// ============================================
// PREVIEW FUNCTIONS
// ============================================

/**
 * Preview what would be affected by a generation operation.
 * Does not modify any data.
 */
export function previewGeneration(
  options: GenerateOptions,
  existingDays: Record<string, PlannedDay>
): {
  totalDays: number;
  lockedDays: number;
  manualDays: number;
  daysToGenerate: number;
} {
  const dates = getDaysInRange(options.startDate, options.endDate);

  let lockedDays = 0;
  let manualDays = 0;

  for (const dateStr of dates) {
    if (!dateStr) continue;
    const existing = existingDays[dateStr];

    if (existing?.isLocked) {
      lockedDays++;
    } else if (existing?.source === 'manual') {
      manualDays++;
    }
  }

  const daysToSkip =
    (options.preserveLocked ? lockedDays : 0) +
    (options.preserveManual ? manualDays : 0);

  return {
    totalDays: dates.length,
    lockedDays,
    manualDays,
    daysToGenerate: dates.length - daysToSkip,
  };
}

/**
 * Preview what would be affected by a revision operation.
 */
export function previewRevision(
  options: RevisionOptions,
  existingDays: Record<string, PlannedDay>
): {
  totalDays: number;
  lockedDays: number;
  manualDays: number;
  daysToRevise: number;
} {
  const dates = getDaysInRange(options.startDate, options.endDate);

  let lockedDays = 0;
  let manualDays = 0;

  for (const dateStr of dates) {
    if (!dateStr) continue;
    const existing = existingDays[dateStr];

    if (existing?.isLocked) {
      lockedDays++;
    } else if (existing?.source === 'manual') {
      manualDays++;
    }
  }

  const daysToSkip =
    (options.overrideLocked ? 0 : lockedDays) +
    (options.overrideManual ? 0 : manualDays);

  return {
    totalDays: dates.length,
    lockedDays,
    manualDays,
    daysToRevise: dates.length - daysToSkip,
  };
}

// ============================================
// OVERNIGHT SHIFT HELPERS
// ============================================

/**
 * Check if a shift is overnight based on start/end times.
 *
 * DOMAIN RULE: Overnight shifts (e.g., 23:00-07:00) belong to the START date.
 * This is not a UI preference, it's how the schedule is modeled.
 */
export function isOvernightShiftByTime(
  startTime: string | null,
  endTime: string | null
): boolean {
  if (!startTime || !endTime) return false;

  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);

  if (startHour === undefined || endHour === undefined) return false;

  // If start hour is greater than end hour, it crosses midnight
  return startHour > endHour;
}

/**
 * Format overnight shift display text.
 * e.g., "Gece (07:00'ye kadar)"
 */
export function formatOvernightShiftDisplay(
  shiftName: string,
  endTime: string
): string {
  return `${shiftName} (${endTime}'e kadar)`;
}
