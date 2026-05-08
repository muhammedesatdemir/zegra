/**
 * Duration Utilities
 *
 * Saat/dakika cinsinden süreleri toplam dakika olarak saklayıp gösterirken
 * kullanılan yardımcılar.
 *
 * Kural: Fazla mesai ve eksik saat ayrı hesaplanır — birbirinden mahsup
 * edilmez, net mesai/ücret hesabı yapılmaz.
 */

import type { PlannedDay } from '../types';

/**
 * Toplam dakikayı saat ve dakikaya ayrıştır.
 * Negatif veya geçersiz değerler 0 olarak normalize edilir.
 */
export function minutesToHM(total: number): { h: number; m: number } {
  if (!Number.isFinite(total) || total <= 0) return { h: 0, m: 0 };
  const safe = Math.floor(total);
  return { h: Math.floor(safe / 60), m: safe % 60 };
}

/**
 * Saat ve dakikadan toplam dakika üret.
 * Negatif veya NaN değerler 0 sayılır; dakika 0-59 ile sınırlanır.
 */
export function hmToMinutes(hours: number, minutes: number): number {
  const h = Number.isFinite(hours) && hours > 0 ? Math.floor(hours) : 0;
  const m = Number.isFinite(minutes) && minutes > 0 ? Math.min(59, Math.floor(minutes)) : 0;
  return h * 60 + m;
}

/**
 * Türkçe okunur format: "2 saat 30 dakika", "45 dakika", "3 saat", "0 dakika"
 */
export function formatDurationTR(total: number): string {
  const { h, m } = minutesToHM(total);
  if (h === 0 && m === 0) return '0 dakika';
  if (h === 0) return `${m} dakika`;
  if (m === 0) return `${h} saat`;
  return `${h} saat ${m} dakika`;
}

/**
 * Belirli bir ay için planlı günler üzerinde fazla mesai ve eksik saati ayrı
 * ayrı toplar. Performans için tüm planlı günler taranmaz — sadece o aya ait
 * tarih anahtarları (YYYY-MM- prefix) kontrol edilir.
 */
export function sumMonthDurations(
  plannedDays: Record<string, PlannedDay>,
  year: number,
  month: number,
): { overtime: number; shortage: number } {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  let overtime = 0;
  let shortage = 0;

  for (const date in plannedDays) {
    if (!date.startsWith(prefix)) continue;
    const day = plannedDays[date];
    if (!day) continue;
    overtime += day.overtimeMinutes ?? 0;
    shortage += day.shortageMinutes ?? 0;
  }

  return { overtime, shortage };
}
