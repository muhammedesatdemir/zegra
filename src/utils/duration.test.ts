import { describe, test, expect } from 'vitest';
import {
  minutesToHM,
  hmToMinutes,
  formatDurationTR,
  sumMonthDurations,
} from './duration';
import type { PlannedDay } from '../types';

describe('minutesToHM', () => {
  test('150 dakika → 2 saat 30 dakika', () => {
    expect(minutesToHM(150)).toEqual({ h: 2, m: 30 });
  });

  test('60 dakika → 1 saat 0 dakika', () => {
    expect(minutesToHM(60)).toEqual({ h: 1, m: 0 });
  });

  test('45 dakika → 0 saat 45 dakika', () => {
    expect(minutesToHM(45)).toEqual({ h: 0, m: 45 });
  });

  test('0 ve negatif değerler 0 olarak normalize edilir', () => {
    expect(minutesToHM(0)).toEqual({ h: 0, m: 0 });
    expect(minutesToHM(-30)).toEqual({ h: 0, m: 0 });
    expect(minutesToHM(NaN)).toEqual({ h: 0, m: 0 });
  });
});

describe('hmToMinutes', () => {
  test('2 saat 30 dakika → 150', () => {
    expect(hmToMinutes(2, 30)).toBe(150);
  });

  test('dakika 0-59 ile sınırlanır', () => {
    expect(hmToMinutes(0, 75)).toBe(59);
  });

  test('negatif/NaN/eksik değerler 0 sayılır', () => {
    expect(hmToMinutes(-1, -5)).toBe(0);
    expect(hmToMinutes(NaN, 30)).toBe(30);
    expect(hmToMinutes(2, NaN)).toBe(120);
  });
});

describe('formatDurationTR', () => {
  test('saat ve dakika birlikte', () => {
    expect(formatDurationTR(150)).toBe('2 saat 30 dakika');
  });

  test('sadece dakika', () => {
    expect(formatDurationTR(45)).toBe('45 dakika');
  });

  test('sadece saat', () => {
    expect(formatDurationTR(120)).toBe('2 saat');
  });

  test('sıfır → "0 dakika"', () => {
    expect(formatDurationTR(0)).toBe('0 dakika');
  });
});

describe('sumMonthDurations', () => {
  const sample: Record<string, PlannedDay> = {
    '2026-04-01': {
      date: '2026-04-01',
      shiftCode: '0715',
      isLocked: false,
      source: 'generated',
      templateId: null,
      note: null,
      overtimeMinutes: 120,
      shortageMinutes: 0,
    },
    '2026-04-15': {
      date: '2026-04-15',
      shiftCode: '0715',
      isLocked: false,
      source: 'manual',
      templateId: null,
      note: null,
      overtimeMinutes: 45,
      shortageMinutes: 30,
    },
    // Mart ayına ait — Nisan toplamına dahil EDİLMEMELİ
    '2026-03-20': {
      date: '2026-03-20',
      shiftCode: '0715',
      isLocked: false,
      source: 'manual',
      templateId: null,
      note: null,
      overtimeMinutes: 999,
      shortageMinutes: 999,
    },
    // Hiç saat alanı olmayan gün — 0 sayılmalı
    '2026-04-10': {
      date: '2026-04-10',
      shiftCode: 'OFF',
      isLocked: false,
      source: 'generated',
      templateId: null,
      note: null,
    },
  };

  test('sadece ilgili ayın günleri toplanır', () => {
    const { overtime, shortage } = sumMonthDurations(sample, 2026, 4);
    expect(overtime).toBe(165);
    expect(shortage).toBe(30);
  });

  test('boş kayıt 0 döndürür', () => {
    expect(sumMonthDurations({}, 2026, 4)).toEqual({ overtime: 0, shortage: 0 });
  });

  test('tek haneli aylar için zero-pad çalışır', () => {
    const data: Record<string, PlannedDay> = {
      '2026-01-05': {
        date: '2026-01-05',
        shiftCode: '0715',
        isLocked: false,
        source: 'generated',
        templateId: null,
        note: null,
        overtimeMinutes: 60,
      },
    };
    expect(sumMonthDurations(data, 2026, 1).overtime).toBe(60);
  });
});
