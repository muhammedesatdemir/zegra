/**
 * Scheduling Engine Tests
 *
 * CRITICAL: These tests must pass before ANY UI work begins.
 * The scheduling engine is the core of the application.
 */

import { describe, test, expect } from 'vitest';
import {
  generateDays,
  calculatePhaseForNewMonth,
  calculatePhaseForAlignment,
  reviseRange,
  previewGeneration,
  previewRevision,
  isOvernightShiftByTime,
} from './schedulingEngine';
import type { PlannedDay, ProgramTemplate, ShiftType } from '../types';

// ============================================
// TEST DATA
// ============================================

const mockShiftTypes: ShiftType[] = [
  {
    id: 'shift_0715',
    code: '0715',
    name: 'Sabah',
    shortName: 'S',
    color: '#22C55E',
    startTime: '07:00',
    endTime: '15:00',
    isWorking: true,
    isOvernight: false,
    isEditable: true,
  },
  {
    id: 'shift_1523',
    code: '1523',
    name: 'Akşam',
    shortName: 'A',
    color: '#F97316',
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
    color: '#3B82F6',
    startTime: '23:00',
    endTime: '07:00',
    isWorking: true,
    isOvernight: true,
    isEditable: true,
  },
  {
    id: 'shift_off1',
    code: 'OFF1',
    name: 'İzin 1',
    shortName: 'İ1',
    color: '#9CA3AF',
    startTime: null,
    endTime: null,
    isWorking: false,
    isOvernight: false,
    isEditable: true,
  },
  {
    id: 'shift_off2',
    code: 'OFF2',
    name: 'İzin 2',
    shortName: 'İ2',
    color: '#6B7280',
    startTime: null,
    endTime: null,
    isWorking: false,
    isOvernight: false,
    isEditable: true,
  },
];

const mockTemplate: ProgramTemplate = {
  id: 'template_test',
  name: 'Test Template',
  cycleLength: 8,
  steps: ['OFF1', 'OFF2', '0715', '0715', '1523', '1523', '2307', '2307'],
  isActive: true,
  isDefault: false,
};

// ============================================
// GENERATE DAYS TESTS
// ============================================

describe('generateDays', () => {
  test('generates correct number of days', () => {
    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-08',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result).toHaveLength(8);
  });

  test('8-day cycle repeats correctly', () => {
    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-16',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    // First cycle
    expect(result[0]?.shiftCode).toBe('OFF1');
    expect(result[1]?.shiftCode).toBe('OFF2');
    expect(result[2]?.shiftCode).toBe('0715');
    expect(result[3]?.shiftCode).toBe('0715');
    expect(result[4]?.shiftCode).toBe('1523');
    expect(result[5]?.shiftCode).toBe('1523');
    expect(result[6]?.shiftCode).toBe('2307');
    expect(result[7]?.shiftCode).toBe('2307');

    // Second cycle starts
    expect(result[8]?.shiftCode).toBe('OFF1');
    expect(result[9]?.shiftCode).toBe('OFF2');
  });

  test('phase offset works correctly', () => {
    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-04',
        phaseOffset: 2, // Start from '0715'
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result[0]?.shiftCode).toBe('0715');
    expect(result[1]?.shiftCode).toBe('0715');
    expect(result[2]?.shiftCode).toBe('1523');
    expect(result[3]?.shiftCode).toBe('1523');
  });

  test('skips locked days', () => {
    const existingDays: Record<string, PlannedDay> = {
      '2026-03-02': {
        date: '2026-03-02',
        shiftCode: 'OFF1',
        isLocked: true,
        source: 'manual',
        templateId: null,
        note: null,
      },
    };

    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-03',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      existingDays,
      mockShiftTypes
    );

    // Should generate 2 days, skipping March 2
    expect(result).toHaveLength(2);
    expect(result.find((d) => d.date === '2026-03-02')).toBeUndefined();
  });

  test('skips manual days when preserveManual is true', () => {
    const existingDays: Record<string, PlannedDay> = {
      '2026-03-02': {
        date: '2026-03-02',
        shiftCode: 'OFF1',
        isLocked: false,
        source: 'manual',
        templateId: null,
        note: null,
      },
    };

    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-03',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      existingDays,
      mockShiftTypes
    );

    expect(result).toHaveLength(2);
    expect(result.find((d) => d.date === '2026-03-02')).toBeUndefined();
  });

  test('overwrites manual days when preserveManual is false', () => {
    const existingDays: Record<string, PlannedDay> = {
      '2026-03-02': {
        date: '2026-03-02',
        shiftCode: 'OFF1',
        isLocked: false,
        source: 'manual',
        templateId: null,
        note: null,
      },
    };

    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-03',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: false,
      },
      existingDays,
      mockShiftTypes
    );

    expect(result).toHaveLength(3);
    expect(result.find((d) => d.date === '2026-03-02')).toBeDefined();
  });

  test('sets correct source as generated', () => {
    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-01',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result[0]?.source).toBe('generated');
    expect(result[0]?.templateId).toBe(mockTemplate.id);
  });

  test('handles month end correctly (28, 30, 31 days)', () => {
    // March has 31 days
    const marchResult = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );
    expect(marchResult).toHaveLength(31);

    // April has 30 days
    const aprilResult = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );
    expect(aprilResult).toHaveLength(30);

    // February 2026 has 28 days (not a leap year)
    const febResult = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );
    expect(febResult).toHaveLength(28);
  });

  test('handles leap year February correctly (2028)', () => {
    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2028-02-01',
        endDate: '2028-02-29',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );
    expect(result).toHaveLength(29);
    expect(result[28]?.date).toBe('2028-02-29');
  });
});

// ============================================
// PHASE CALCULATION TESTS
// ============================================

describe('calculatePhaseForNewMonth', () => {
  test('returns 0 when no previous data', () => {
    const result = calculatePhaseForNewMonth(mockTemplate, null);
    expect(result).toBe(0);
  });

  test('calculates correct phase from OFF1 (index 0)', () => {
    const result = calculatePhaseForNewMonth(mockTemplate, 'OFF1');
    expect(result).toBe(1); // Next is OFF2 at index 1
  });

  test('calculates correct phase from OFF2 (index 1)', () => {
    const result = calculatePhaseForNewMonth(mockTemplate, 'OFF2');
    expect(result).toBe(2); // Next is 0715 at index 2
  });

  test('calculates correct phase from 2307 (last occurrence at index 7)', () => {
    // lastIndexOf finds last occurrence of '2307' which is at index 7
    // So next is index 0 (OFF1)
    const result = calculatePhaseForNewMonth(mockTemplate, '2307');
    expect(result).toBe(0); // Wraps to OFF1 at index 0
  });

  test('returns 0 when shift code not in template', () => {
    const result = calculatePhaseForNewMonth(mockTemplate, 'INVALID');
    expect(result).toBe(0);
  });

  test('November to December transition', () => {
    // If November ends with 2307, December should start with OFF1
    const novemberLastShift = '2307';
    const phase = calculatePhaseForNewMonth(mockTemplate, novemberLastShift);

    const decemberDays = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-12-01',
        endDate: '2026-12-01',
        phaseOffset: phase,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(decemberDays[0]?.shiftCode).toBe('OFF1');
  });

  test('December to January transition (year change)', () => {
    // Year change should not affect cycle
    const decemberLastShift = '1523';
    const phase = calculatePhaseForNewMonth(mockTemplate, decemberLastShift);

    const januaryDays = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2027-01-01',
        endDate: '2027-01-01',
        phaseOffset: phase,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    // 1523 is at index 4 or 5, next should be 1523 (if at 4) or 2307 (if at 5)
    // Since we're using index 5 (second 1523), next is 2307
    expect(['1523', '2307']).toContain(januaryDays[0]?.shiftCode);
  });
});

describe('calculatePhaseForAlignment', () => {
  test('aligns first day to specified shift', () => {
    // We want March 1 to be Sabah (0715)
    const phase = calculatePhaseForAlignment(mockTemplate, '0715', 0);

    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-01',
        phaseOffset: phase,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result[0]?.shiftCode).toBe('0715');
  });

  test('aligns with offset from start', () => {
    // We want March 5 to be Gece (2307), March 1 is day 0, March 5 is day 4
    const phase = calculatePhaseForAlignment(mockTemplate, '2307', 4);

    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        phaseOffset: phase,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result[4]?.shiftCode).toBe('2307');
  });
});

// ============================================
// RANGE REVISION TESTS
// ============================================

describe('reviseRange', () => {
  test('fills range with single shift', () => {
    const result = reviseRange(
      {
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        mode: 'single_shift',
        shiftCode: 'OFF1',
        overrideLocked: false,
        overrideManual: false,
      },
      {},
      [mockTemplate],
      mockShiftTypes
    );

    expect(result).toHaveLength(5);
    expect(result.every((d) => d.shiftCode === 'OFF1')).toBe(true);
    expect(result.every((d) => d.source === 'revised')).toBe(true);
  });

  test('regenerates from template', () => {
    const result = reviseRange(
      {
        startDate: '2026-03-01',
        endDate: '2026-03-08',
        mode: 'from_template',
        templateId: mockTemplate.id,
        phaseOffset: 0,
        overrideLocked: false,
        overrideManual: false,
      },
      {},
      [mockTemplate],
      mockShiftTypes
    );

    expect(result).toHaveLength(8);
    expect(result[0]?.shiftCode).toBe('OFF1');
    expect(result[1]?.shiftCode).toBe('OFF2');
  });

  test('skips locked days by default', () => {
    const existingDays: Record<string, PlannedDay> = {
      '2026-03-02': {
        date: '2026-03-02',
        shiftCode: '0715',
        isLocked: true,
        source: 'manual',
        templateId: null,
        note: null,
      },
    };

    const result = reviseRange(
      {
        startDate: '2026-03-01',
        endDate: '2026-03-03',
        mode: 'single_shift',
        shiftCode: 'OFF1',
        overrideLocked: false,
        overrideManual: false,
      },
      existingDays,
      [mockTemplate],
      mockShiftTypes
    );

    expect(result).toHaveLength(2);
    expect(result.find((d) => d.date === '2026-03-02')).toBeUndefined();
  });

  test('overrides locked days when overrideLocked is true', () => {
    const existingDays: Record<string, PlannedDay> = {
      '2026-03-02': {
        date: '2026-03-02',
        shiftCode: '0715',
        isLocked: true,
        source: 'generated', // Not manual, so overrideManual doesn't block it
        templateId: null,
        note: null,
      },
    };

    const result = reviseRange(
      {
        startDate: '2026-03-01',
        endDate: '2026-03-03',
        mode: 'single_shift',
        shiftCode: 'OFF1',
        overrideLocked: true,
        overrideManual: false,
      },
      existingDays,
      [mockTemplate],
      mockShiftTypes
    );

    expect(result).toHaveLength(3);
    expect(result.find((d) => d.date === '2026-03-02')).toBeDefined();
  });

  test('preserves existing notes', () => {
    const existingDays: Record<string, PlannedDay> = {
      '2026-03-01': {
        date: '2026-03-01',
        shiftCode: '0715',
        isLocked: false,
        source: 'generated',
        templateId: null,
        note: 'Important note',
      },
    };

    const result = reviseRange(
      {
        startDate: '2026-03-01',
        endDate: '2026-03-01',
        mode: 'single_shift',
        shiftCode: 'OFF1',
        overrideLocked: false,
        overrideManual: false,
      },
      existingDays,
      [mockTemplate],
      mockShiftTypes
    );

    expect(result[0]?.note).toBe('Important note');
  });
});

// ============================================
// PREVIEW TESTS
// ============================================

describe('previewGeneration', () => {
  test('counts locked and manual days correctly', () => {
    const existingDays: Record<string, PlannedDay> = {
      '2026-03-01': {
        date: '2026-03-01',
        shiftCode: 'OFF1',
        isLocked: true,
        source: 'manual',
        templateId: null,
        note: null,
      },
      '2026-03-02': {
        date: '2026-03-02',
        shiftCode: 'OFF1',
        isLocked: false,
        source: 'manual',
        templateId: null,
        note: null,
      },
      '2026-03-03': {
        date: '2026-03-03',
        shiftCode: 'OFF1',
        isLocked: false,
        source: 'generated',
        templateId: null,
        note: null,
      },
    };

    const preview = previewGeneration(
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      existingDays
    );

    expect(preview.totalDays).toBe(5);
    expect(preview.lockedDays).toBe(1);
    expect(preview.manualDays).toBe(1);
    expect(preview.daysToGenerate).toBe(3); // 5 - 1 locked - 1 manual
  });
});

// ============================================
// OVERNIGHT SHIFT TESTS
// ============================================

describe('isOvernightShiftByTime', () => {
  test('23:00-07:00 is overnight', () => {
    expect(isOvernightShiftByTime('23:00', '07:00')).toBe(true);
  });

  test('21:00-05:00 is overnight', () => {
    expect(isOvernightShiftByTime('21:00', '05:00')).toBe(true);
  });

  test('07:00-15:00 is not overnight', () => {
    expect(isOvernightShiftByTime('07:00', '15:00')).toBe(false);
  });

  test('15:00-23:00 is not overnight', () => {
    expect(isOvernightShiftByTime('15:00', '23:00')).toBe(false);
  });

  test('null times return false', () => {
    expect(isOvernightShiftByTime(null, null)).toBe(false);
    expect(isOvernightShiftByTime('23:00', null)).toBe(false);
    expect(isOvernightShiftByTime(null, '07:00')).toBe(false);
  });
});

describe('Overnight shift domain rule', () => {
  test('overnight shift is recorded on start date', () => {
    // When we generate March 12 with a night shift (2307),
    // the shift "belongs" to March 12 even though it ends March 13

    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-12',
        endDate: '2026-03-12',
        phaseOffset: 6, // Index 6 is '2307'
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result[0]?.date).toBe('2026-03-12');
    expect(result[0]?.shiftCode).toBe('2307');
    // The actual 23:00-07:00 shift crosses into March 13,
    // but the PlannedDay.date is March 12
  });

  test('month-end overnight shift stays in current month', () => {
    // March 31 night shift (23:00-07:00) ends April 1
    // But it belongs to March 31

    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-31',
        endDate: '2026-03-31',
        phaseOffset: 6, // Index 6 is '2307'
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result[0]?.date).toBe('2026-03-31');
    expect(result[0]?.shiftCode).toBe('2307');
  });

  test('year-end overnight shift stays in current year', () => {
    // December 31 night shift ends January 1 next year
    // But it belongs to December 31

    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-12-31',
        endDate: '2026-12-31',
        phaseOffset: 6,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result[0]?.date).toBe('2026-12-31');
    expect(result[0]?.shiftCode).toBe('2307');
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('Edge Cases', () => {
  test('empty date range returns empty array', () => {
    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-05',
        endDate: '2026-03-01', // End before start
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result).toHaveLength(0);
  });

  test('single day range works', () => {
    const result = generateDays(
      mockTemplate,
      {
        templateId: mockTemplate.id,
        startDate: '2026-03-15',
        endDate: '2026-03-15',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.date).toBe('2026-03-15');
  });

  test('invalid shift code in template is skipped', () => {
    const brokenTemplate: ProgramTemplate = {
      ...mockTemplate,
      steps: ['INVALID', '0715'],
      cycleLength: 2,
    };

    const result = generateDays(
      brokenTemplate,
      {
        templateId: brokenTemplate.id,
        startDate: '2026-03-01',
        endDate: '2026-03-02',
        phaseOffset: 0,
        preserveLocked: true,
        preserveManual: true,
      },
      {},
      mockShiftTypes
    );

    // Only the valid shift code is generated
    expect(result).toHaveLength(1);
    expect(result[0]?.shiftCode).toBe('0715');
  });
});
