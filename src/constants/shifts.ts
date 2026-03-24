/**
 * Default Shift Types
 *
 * These are the system defaults based on real-world Excel data.
 * Users can customize these in settings.
 */

import type { ShiftType, ProgramTemplate } from '../types';

// ============================================
// DEFAULT SHIFT TYPES
// ============================================

export const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  {
    id: 'shift_0715',
    code: '0715',
    name: 'Sabah',
    shortName: 'S',
    color: '#22C55E', // green
    startTime: '07:00',
    endTime: '15:00',
    isWorking: true,
    isOvernight: false,
    isEditable: true,
  },
  {
    id: 'shift_1523',
    code: '1523',
    name: 'Öğle',
    shortName: 'Ö',
    color: '#F97316', // orange
    startTime: '15:00',
    endTime: '23:00',
    isWorking: true,
    isOvernight: false,
    isEditable: true,
  },
  {
    id: 'shift_2307',
    code: '2307',
    name: 'Gece',
    shortName: 'G',
    color: '#3B82F6', // blue
    startTime: '23:00',
    endTime: '07:00',
    isWorking: true,
    isOvernight: true,
    isEditable: true,
  },
  {
    id: 'shift_off',
    code: 'OFF',
    name: 'Off',
    shortName: 'Off',
    color: '#9CA3AF', // gray
    startTime: null,
    endTime: null,
    isWorking: false,
    isOvernight: false,
    isEditable: true,
  },
  // Internal OFF variants - used for cycle differentiation, displayed as "Off" in UI
  {
    id: 'shift_off1',
    code: 'OFF1',
    name: 'Off',
    shortName: 'Off',
    color: '#9CA3AF', // gray - same as OFF for visual consistency
    startTime: null,
    endTime: null,
    isWorking: false,
    isOvernight: false,
    isEditable: true,
  },
  {
    id: 'shift_off2',
    code: 'OFF2',
    name: 'Off',
    shortName: 'Off',
    color: '#9CA3AF', // gray - same as OFF for visual consistency
    startTime: null,
    endTime: null,
    isWorking: false,
    isOvernight: false,
    isEditable: true,
  },
];

// ============================================
// DEFAULT TEMPLATES
// ============================================

export const DEFAULT_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'template_byg_a1',
    name: 'BYG-A1',
    cycleLength: 8,
    steps: ['OFF1', 'OFF2', '0715', '0715', '1523', '1523', '2307', '2307'],
    isActive: true,
    isDefault: true,
  },
  {
    id: 'template_byg_b1',
    name: 'BYG-B1',
    cycleLength: 8,
    steps: ['2307', 'OFF1', 'OFF2', '0715', '0715', '1523', '1523', '2307'],
    isActive: false,
    isDefault: true,
  },
  {
    id: 'template_byg_c1',
    name: 'BYG-C1',
    cycleLength: 8,
    steps: ['OFF2', '0715', '0715', '1523', '1523', '2307', '2307', 'OFF1'],
    isActive: false,
    isDefault: true,
  },
  {
    id: 'template_byg_d1',
    name: 'BYG-D1',
    cycleLength: 8,
    steps: ['0715', '1523', '1523', '2307', '2307', 'OFF1', 'OFF2', '0715'],
    isActive: false,
    isDefault: true,
  },
];

// ============================================
// DEFAULT SETTINGS
// ============================================

export const DEFAULT_SETTINGS = {
  activeTemplateId: 'template_byg_a1',
  weekStartsOnMonday: true,
  theme: 'light' as const,
  showOffVariants: false,
  onboardingDone: false,
};

// ============================================
// HELPERS
// ============================================

/**
 * Get shift type by code
 */
export function getShiftByCode(
  shiftTypes: ShiftType[],
  code: string
): ShiftType | undefined {
  return shiftTypes.find((st) => st.code === code);
}

/**
 * Check if a shift code represents an overnight shift
 */
export function isOvernightShift(shiftType: ShiftType): boolean {
  return shiftType.isOvernight;
}

/**
 * Check if a shift code represents a working day
 */
export function isWorkingShift(shiftType: ShiftType): boolean {
  return shiftType.isWorking;
}

/**
 * Get OFF codes (for grouping in UI when showOffVariants is false)
 */
export function isOffCode(code: string): boolean {
  return code === 'OFF' || code === 'OFF1' || code === 'OFF2';
}
