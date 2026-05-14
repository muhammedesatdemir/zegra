/**
 * Türkiye Resmi Tatilleri (frontend gösterimi için)
 *
 * Yalnızca takvimde küçük bir marker ve gün detayında bir etiket göstermek
 * üzere tutulan sabit liste. Bu veri arka uç / iş mantığı için kaynak
 * değildir — vardiya planlamasına etki etmez.
 *
 * İslami bayram tarihleri (Ramazan / Kurban) her yıl değişir. Bu dosyada
 * yer alan 2026 tarihleri kullanıcının verdiği listeye göre eklenmiştir;
 * yayına almadan önce resmi (Diyanet / Resmi Gazete) kaynakla doğrulamak
 * gerekir. Yapı yıl bazında genişletilebilir.
 */

export interface TurkeyHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

const HOLIDAYS_2026: TurkeyHoliday[] = [
  { date: '2026-01-01', name: 'Yılbaşı' },
  // Ramazan Bayramı — doğrulanmalı
  { date: '2026-03-20', name: 'Ramazan Bayramı Arifesi' },
  { date: '2026-03-21', name: 'Ramazan Bayramı 1. Gün' },
  { date: '2026-03-22', name: 'Ramazan Bayramı 2. Gün' },
  { date: '2026-03-23', name: 'Ramazan Bayramı 3. Gün' },
  { date: '2026-04-23', name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { date: '2026-05-01', name: 'Emek ve Dayanışma Günü' },
  { date: '2026-05-19', name: 'Atatürk’ü Anma, Gençlik ve Spor Bayramı' },
  // Kurban Bayramı — doğrulanmalı
  { date: '2026-05-26', name: 'Kurban Bayramı Arifesi' },
  { date: '2026-05-27', name: 'Kurban Bayramı 1. Gün' },
  { date: '2026-05-28', name: 'Kurban Bayramı 2. Gün' },
  { date: '2026-05-29', name: 'Kurban Bayramı 3. Gün' },
  { date: '2026-05-30', name: 'Kurban Bayramı 4. Gün' },
  { date: '2026-07-15', name: 'Demokrasi ve Millî Birlik Günü' },
  { date: '2026-08-30', name: 'Zafer Bayramı' },
  { date: '2026-10-28', name: 'Cumhuriyet Bayramı Arifesi' },
  { date: '2026-10-29', name: 'Cumhuriyet Bayramı' },
];

const HOLIDAY_INDEX: Record<string, string> = HOLIDAYS_2026.reduce(
  (acc, h) => {
    acc[h.date] = h.name;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * ISO tarihten (YYYY-MM-DD) resmi tatil adını döner; tatil değilse null.
 */
export function getHolidayName(dateISO: string): string | null {
  return HOLIDAY_INDEX[dateISO] ?? null;
}

/**
 * Verilen ISO tarihin resmi tatil olup olmadığını döner.
 */
export function isHoliday(dateISO: string): boolean {
  return dateISO in HOLIDAY_INDEX;
}
