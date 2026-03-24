/**
 * Turkish String Utilities Tests
 *
 * These tests verify correct handling of Turkish characters,
 * especially the i/İ/ı/I distinction which is critical.
 */

import { describe, test, expect } from 'vitest';
import {
  toUpperTR,
  toLowerTR,
  compareTR,
  includesTR,
  startsWithTR,
  getMonthNameTR,
  getWeekdayNameTR,
} from './turkish';

describe('Turkish Case Conversion', () => {
  describe('toUpperTR', () => {
    test('ı → I (dotless i to capital I)', () => {
      expect(toUpperTR('ı')).toBe('I');
      expect(toUpperTR('ılık')).toBe('ILIK');
    });

    test('i → İ (dotted i to capital İ)', () => {
      expect(toUpperTR('i')).toBe('İ');
      expect(toUpperTR('istanbul')).toBe('İSTANBUL');
    });

    test('handles mixed Turkish characters', () => {
      expect(toUpperTR('çalışma')).toBe('ÇALIŞMA');
      expect(toUpperTR('öğle')).toBe('ÖĞLE');
      expect(toUpperTR('şükran')).toBe('ŞÜKRAN');
      expect(toUpperTR('güneş')).toBe('GÜNEŞ');
    });

    test('handles already uppercase', () => {
      expect(toUpperTR('ABC')).toBe('ABC');
      expect(toUpperTR('ÇŞĞ')).toBe('ÇŞĞ');
    });
  });

  describe('toLowerTR', () => {
    test('I → ı (capital I to dotless i)', () => {
      expect(toLowerTR('I')).toBe('ı');
      expect(toLowerTR('ILIK')).toBe('ılık');
    });

    test('İ → i (capital İ to dotted i)', () => {
      expect(toLowerTR('İ')).toBe('i');
      expect(toLowerTR('İSTANBUL')).toBe('istanbul');
    });

    test('handles mixed Turkish characters', () => {
      expect(toLowerTR('ÇALIŞMA')).toBe('çalışma');
      expect(toLowerTR('ÖĞLE')).toBe('öğle');
      expect(toLowerTR('ŞÜKRAN')).toBe('şükran');
      expect(toLowerTR('GÜNEŞ')).toBe('güneş');
    });

    test('handles already lowercase', () => {
      expect(toLowerTR('abc')).toBe('abc');
      expect(toLowerTR('çşğ')).toBe('çşğ');
    });
  });

  describe('Round-trip conversion', () => {
    test('lowercase → uppercase → lowercase', () => {
      const original = 'ılık istanbul çalışma';
      const upper = toUpperTR(original);
      const lower = toLowerTR(upper);
      expect(lower).toBe(original);
    });

    test('uppercase → lowercase → uppercase', () => {
      const original = 'ILIK İSTANBUL ÇALIŞMA';
      const lower = toLowerTR(original);
      const upper = toUpperTR(lower);
      expect(upper).toBe(original);
    });
  });
});

describe('Turkish String Comparison', () => {
  describe('compareTR', () => {
    test('ç comes after c', () => {
      expect(compareTR('ç', 'd')).toBeLessThan(0); // ç < d
      expect(compareTR('c', 'ç')).toBeLessThan(0); // c < ç
    });

    test('ğ comes after g', () => {
      expect(compareTR('ğ', 'h')).toBeLessThan(0); // ğ < h
      expect(compareTR('g', 'ğ')).toBeLessThan(0); // g < ğ
    });

    test('ş comes after s', () => {
      expect(compareTR('ş', 't')).toBeLessThan(0); // ş < t
      expect(compareTR('s', 'ş')).toBeLessThan(0); // s < ş
    });

    test('ı and i are different', () => {
      expect(compareTR('ı', 'i')).not.toBe(0);
    });
  });

  describe('includesTR', () => {
    test('case-insensitive search works', () => {
      expect(includesTR('İstanbul', 'ist')).toBe(true);
      expect(includesTR('ÇALIŞMA', 'çalış')).toBe(true);
    });

    test('handles ı/i correctly', () => {
      expect(includesTR('ILIK', 'ılık')).toBe(true);
      expect(includesTR('ılık', 'ILIK')).toBe(true);
    });
  });

  describe('startsWithTR', () => {
    test('case-insensitive prefix check works', () => {
      expect(startsWithTR('İstanbul', 'ist')).toBe(true);
      expect(startsWithTR('ÇARŞAMBA', 'çar')).toBe(true);
    });
  });
});

describe('Turkish Month Names', () => {
  test('returns correct month names', () => {
    expect(getMonthNameTR(1)).toBe('Ocak');
    expect(getMonthNameTR(2)).toBe('Şubat');
    expect(getMonthNameTR(3)).toBe('Mart');
    expect(getMonthNameTR(4)).toBe('Nisan');
    expect(getMonthNameTR(5)).toBe('Mayıs');
    expect(getMonthNameTR(6)).toBe('Haziran');
    expect(getMonthNameTR(7)).toBe('Temmuz');
    expect(getMonthNameTR(8)).toBe('Ağustos');
    expect(getMonthNameTR(9)).toBe('Eylül');
    expect(getMonthNameTR(10)).toBe('Ekim');
    expect(getMonthNameTR(11)).toBe('Kasım');
    expect(getMonthNameTR(12)).toBe('Aralık');
  });

  test('throws for invalid month', () => {
    expect(() => getMonthNameTR(0)).toThrow();
    expect(() => getMonthNameTR(13)).toThrow();
  });
});

describe('Turkish Weekday Names', () => {
  test('returns correct weekday names (Sunday start)', () => {
    expect(getWeekdayNameTR(0)).toBe('Pazar');
    expect(getWeekdayNameTR(1)).toBe('Pazartesi');
    expect(getWeekdayNameTR(2)).toBe('Salı');
    expect(getWeekdayNameTR(3)).toBe('Çarşamba');
    expect(getWeekdayNameTR(4)).toBe('Perşembe');
    expect(getWeekdayNameTR(5)).toBe('Cuma');
    expect(getWeekdayNameTR(6)).toBe('Cumartesi');
  });

  test('returns correct weekday names (Monday start)', () => {
    expect(getWeekdayNameTR(0, true)).toBe('Pazartesi');
    expect(getWeekdayNameTR(1, true)).toBe('Salı');
    expect(getWeekdayNameTR(2, true)).toBe('Çarşamba');
    expect(getWeekdayNameTR(3, true)).toBe('Perşembe');
    expect(getWeekdayNameTR(4, true)).toBe('Cuma');
    expect(getWeekdayNameTR(5, true)).toBe('Cumartesi');
    expect(getWeekdayNameTR(6, true)).toBe('Pazar');
  });
});

describe('Special Character Verification', () => {
  test('all Turkish special characters render correctly', () => {
    // This test ensures no mojibake or encoding issues
    const turkishChars = 'çÇğĞıIiİöÖşŞüÜ';
    expect(turkishChars.length).toBe(14);

    // Each character should be distinct
    const charSet = new Set(turkishChars);
    expect(charSet.size).toBe(14);
  });

  test('Turkish characters survive serialization', () => {
    const original = { name: 'Çalışma Programı', code: 'İŞ' };
    const serialized = JSON.stringify(original);
    const parsed = JSON.parse(serialized);

    expect(parsed.name).toBe('Çalışma Programı');
    expect(parsed.code).toBe('İŞ');
  });
});
