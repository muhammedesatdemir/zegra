/**
 * File Repository Tests
 *
 * FileRepository uses expo-file-system (async I/O) but exposes a
 * synchronous IScheduleRepository interface via in-memory cache.
 *
 * Since expo-file-system requires a native runtime, we test the
 * repository contract using MemoryRepository which has identical
 * cache logic. The file I/O layer is tested manually on device.
 *
 * These tests verify:
 * 1. Repository contract (read/write/delete for all entity types)
 * 2. JSON serialization round-trips
 * 3. Default initialization behavior
 * 4. Corrupt data recovery patterns
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { MemoryRepository } from './memoryRepository';
import type { PlannedDay, ProgramTemplate, ShiftType, AppSettings } from '../types';
import type { StorageData } from './types';
import {
  DEFAULT_SHIFT_TYPES,
  DEFAULT_TEMPLATES,
  DEFAULT_SETTINGS,
} from '../constants/shifts';

// ============================================
// HELPERS
// ============================================

function createRepo(): MemoryRepository {
  const repo = new MemoryRepository();
  repo.initializeDefaults();
  return repo;
}

function makePlannedDay(overrides: Partial<PlannedDay> = {}): PlannedDay {
  return {
    date: '2026-04-08',
    shiftCode: '0715',
    isLocked: false,
    source: 'generated',
    templateId: 'template_byg_a1',
    note: null,
    cycleIndex: 2,
    ...overrides,
  };
}

// ============================================
// REPOSITORY CONTRACT TESTS
// ============================================

describe('Repository Contract', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = createRepo();
  });

  // --- Planned Days ---

  test('planned day round-trip: set → get', () => {
    const day = makePlannedDay();
    repo.setPlannedDay(day);

    const retrieved = repo.getPlannedDay('2026-04-08');
    expect(retrieved).toEqual(day);
  });

  test('planned day preserves all fields including optional ones', () => {
    const day = makePlannedDay({
      date: '2026-04-10',
      shiftCode: '2307',
      isLocked: true,
      source: 'manual',
      templateId: null,
      note: 'Nöbet değişimi',
      cycleIndex: 6,
      customStartTime: '22:00',
      customEndTime: '06:00',
    });

    repo.setPlannedDay(day);
    const retrieved = repo.getPlannedDay('2026-04-10');

    expect(retrieved?.isLocked).toBe(true);
    expect(retrieved?.source).toBe('manual');
    expect(retrieved?.note).toBe('Nöbet değişimi');
    expect(retrieved?.cycleIndex).toBe(6);
    expect(retrieved?.customStartTime).toBe('22:00');
    expect(retrieved?.customEndTime).toBe('06:00');
  });

  test('setPlannedDays stores multiple days', () => {
    const days = [
      makePlannedDay({ date: '2026-04-01' }),
      makePlannedDay({ date: '2026-04-02', shiftCode: '1523' }),
      makePlannedDay({ date: '2026-04-03', shiftCode: '2307' }),
    ];

    repo.setPlannedDays(days);

    expect(repo.getPlannedDay('2026-04-01')?.shiftCode).toBe('0715');
    expect(repo.getPlannedDay('2026-04-02')?.shiftCode).toBe('1523');
    expect(repo.getPlannedDay('2026-04-03')?.shiftCode).toBe('2307');
  });

  test('delete planned day', () => {
    repo.setPlannedDay(makePlannedDay());
    expect(repo.getPlannedDay('2026-04-08')).not.toBeNull();

    repo.deletePlannedDay('2026-04-08');
    expect(repo.getPlannedDay('2026-04-08')).toBeNull();
  });

  test('lock and unlock planned day', () => {
    repo.setPlannedDay(makePlannedDay({ isLocked: false }));

    repo.lockPlannedDay('2026-04-08');
    expect(repo.getPlannedDay('2026-04-08')?.isLocked).toBe(true);

    repo.unlockPlannedDay('2026-04-08');
    expect(repo.getPlannedDay('2026-04-08')?.isLocked).toBe(false);
  });

  test('getPlannedDaysByMonth returns correct days', () => {
    repo.setPlannedDays([
      makePlannedDay({ date: '2026-03-31' }),
      makePlannedDay({ date: '2026-04-01' }),
      makePlannedDay({ date: '2026-04-15' }),
      makePlannedDay({ date: '2026-04-30' }),
      makePlannedDay({ date: '2026-05-01' }),
    ]);

    const aprilDays = repo.getPlannedDaysByMonth(2026, 4);
    expect(aprilDays).toHaveLength(3);
    expect(aprilDays.map((d) => d.date)).toEqual([
      '2026-04-01',
      '2026-04-15',
      '2026-04-30',
    ]);
  });

  // --- Templates ---

  test('template round-trip: set → get', () => {
    const template: ProgramTemplate = {
      id: 'test_custom',
      name: 'Özel Programım',
      cycleLength: 4,
      steps: ['0715', '1523', '2307', 'OFF1'],
      isActive: false,
      isDefault: false,
    };

    repo.setTemplate(template);
    const retrieved = repo.getTemplateById('test_custom');
    expect(retrieved).toEqual(template);
  });

  test('setActiveTemplate updates isActive flags', () => {
    repo.setActiveTemplate('template_byg_b1');

    const templates = repo.getTemplates();
    const active = templates.filter((t) => t.isActive);
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe('template_byg_b1');
  });

  test('deleteTemplate clears activeTemplateId if deleted', () => {
    repo.setActiveTemplate('template_byg_a1');
    repo.deleteTemplate('template_byg_a1');

    const settings = repo.getSettings();
    expect(settings.activeTemplateId).toBeNull();
  });

  // --- Shift Types ---

  test('shift type round-trip: set → get', () => {
    const customShift: ShiftType = {
      id: 'shift_custom',
      code: '0812',
      name: 'Özel',
      shortName: 'Ö',
      color: '#FF0000',
      startTime: '08:00',
      endTime: '12:00',
      isWorking: true,
      isOvernight: false,
      isEditable: true,
    };

    repo.setShiftType(customShift);
    expect(repo.getShiftTypeByCode('0812')).toEqual(customShift);
  });

  test('deleteShiftType removes by id', () => {
    const initial = repo.getShiftTypes().length;
    repo.deleteShiftType('shift_0715');
    expect(repo.getShiftTypes()).toHaveLength(initial - 1);
    expect(repo.getShiftTypeByCode('0715')).toBeNull();
  });

  // --- Settings ---

  test('settings round-trip: set → get', () => {
    repo.setSettings({ theme: 'dark', weekStartsOnMonday: false });

    const settings = repo.getSettings();
    expect(settings.theme).toBe('dark');
    expect(settings.weekStartsOnMonday).toBe(false);
    expect(settings.showOffVariants).toBe(false);
  });

  test('partial settings update preserves other fields', () => {
    repo.setSettings({ theme: 'dark' });
    repo.setSettings({ showOffVariants: true });

    const settings = repo.getSettings();
    expect(settings.theme).toBe('dark');
    expect(settings.showOffVariants).toBe(true);
  });

  // --- Data Management ---

  test('exportAllData produces valid JSON with all data', () => {
    repo.setPlannedDay(makePlannedDay());
    repo.setSettings({ theme: 'dark' });

    const exported = repo.exportAllData();
    const data: StorageData = JSON.parse(exported);

    expect(data.version).toBe(1);
    expect(data.shiftTypes.length).toBeGreaterThan(0);
    expect(data.templates.length).toBeGreaterThan(0);
    expect(data.plannedDays['2026-04-08']).toBeDefined();
    expect(data.settings.theme).toBe('dark');
  });

  test('clearAllData + initializeDefaults restores defaults', () => {
    repo.setPlannedDay(makePlannedDay());
    repo.setSettings({ theme: 'dark' });

    repo.clearAllData();
    repo.initializeDefaults();

    expect(Object.keys(repo.getAllPlannedDays())).toHaveLength(0);
    expect(repo.getTemplates().length).toBe(DEFAULT_TEMPLATES.length);
    expect(repo.getShiftTypes().length).toBe(DEFAULT_SHIFT_TYPES.length);
  });
});

// ============================================
// SERIALIZATION ROUND-TRIP TESTS
// ============================================

describe('Serialization Round-Trip', () => {
  test('PlannedDay survives JSON round-trip', () => {
    const day = makePlannedDay({
      isLocked: true,
      source: 'manual',
      note: 'Türkçe not: çğıöşü',
      customStartTime: '08:30',
    });

    const json = JSON.stringify(day);
    const parsed: PlannedDay = JSON.parse(json);

    expect(parsed).toEqual(day);
    expect(parsed.note).toBe('Türkçe not: çğıöşü');
  });

  test('Record<string, PlannedDay> survives JSON round-trip', () => {
    const days: Record<string, PlannedDay> = {
      '2026-04-01': makePlannedDay({ date: '2026-04-01' }),
      '2026-04-02': makePlannedDay({ date: '2026-04-02', source: 'manual', isLocked: true }),
    };

    const json = JSON.stringify(days);
    const parsed: Record<string, PlannedDay> = JSON.parse(json);

    expect(Object.keys(parsed)).toHaveLength(2);
    expect(parsed['2026-04-02']?.isLocked).toBe(true);
    expect(parsed['2026-04-02']?.source).toBe('manual');
  });

  test('StorageData survives full export/import cycle', () => {
    const repo = createRepo();
    repo.setPlannedDay(makePlannedDay());
    repo.setSettings({ theme: 'dark' });

    const exported = repo.exportAllData();
    const imported: StorageData = JSON.parse(exported);

    expect(imported.version).toBe(1);
    expect(imported.plannedDays['2026-04-08']?.shiftCode).toBe('0715');
    expect(imported.settings.theme).toBe('dark');
    expect(imported.templates.length).toBe(DEFAULT_TEMPLATES.length);
    expect(imported.shiftTypes.length).toBe(DEFAULT_SHIFT_TYPES.length);
  });
});

// ============================================
// DEFAULT INITIALIZATION TESTS
// ============================================

describe('Default Initialization', () => {
  test('fresh repo has default shift types after initializeDefaults', () => {
    const repo = createRepo();
    const shiftTypes = repo.getShiftTypes();

    expect(shiftTypes.length).toBe(DEFAULT_SHIFT_TYPES.length);
    expect(shiftTypes.some((st) => st.code === '0715')).toBe(true);
    expect(shiftTypes.some((st) => st.code === '2307')).toBe(true);
    expect(shiftTypes.some((st) => st.code === 'OFF1')).toBe(true);
  });

  test('fresh repo has default templates after initializeDefaults', () => {
    const repo = createRepo();
    const templates = repo.getTemplates();

    expect(templates.length).toBe(DEFAULT_TEMPLATES.length);
    expect(templates.some((t) => t.name === 'BYG-A1')).toBe(true);
  });

  test('initializeDefaults does not overwrite existing data', () => {
    const repo = createRepo();

    repo.setShiftType({
      id: 'shift_custom',
      code: 'CUSTOM',
      name: 'Özel',
      shortName: 'X',
      color: '#000',
      startTime: '10:00',
      endTime: '18:00',
      isWorking: true,
      isOvernight: false,
      isEditable: true,
    });

    repo.initializeDefaults();
    expect(repo.getShiftTypeByCode('CUSTOM')).not.toBeNull();
  });
});

// ============================================
// CORRUPT DATA RECOVERY TESTS
// ============================================

describe('Corrupt Data Recovery', () => {
  test('invalid JSON falls back to default (simulated)', () => {
    const fallback = { ...DEFAULT_SETTINGS };

    let result: AppSettings;
    try {
      result = JSON.parse('{broken json!!!}');
    } catch {
      result = fallback;
    }

    expect(result.weekStartsOnMonday).toBe(true);
    expect(result.theme).toBe('light');
  });

  test('missing fields in parsed data retain type shape', () => {
    const partialJSON = '{"theme":"dark"}';
    const parsed = JSON.parse(partialJSON);
    const settings: AppSettings = { ...DEFAULT_SETTINGS, ...parsed };

    expect(settings.theme).toBe('dark');
    expect(settings.weekStartsOnMonday).toBe(true);
    expect(settings.onboardingDone).toBe(false);
  });

  test('empty planned days object is valid', () => {
    const json = '{}';
    const parsed: Record<string, PlannedDay> = JSON.parse(json);
    expect(Object.keys(parsed)).toHaveLength(0);
  });
});

// ============================================
// MANUAL TEST CHECKLIST (for real device testing)
// ============================================

/**
 * Run on device/emulator (Expo Go or development build):
 *
 * 1. Fresh install → default templates and shift types shown
 * 2. Generate April 2026 → force close → reopen → days still there
 * 3. Create custom template → force close → reopen → template exists
 * 4. Edit a day (change shift, add note, lock) → force close → reopen → edits preserved
 * 5. Change theme to dark → force close → reopen → theme still dark
 * 6. Switch active template → force close → reopen → selection preserved
 * 7. Clear all data → force close → reopen → defaults restored
 */
