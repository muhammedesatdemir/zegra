/**
 * MonthPicker
 *
 * Mesai Özeti ve Aylık Notlar gibi raporlama görünümlerinde ortak kullanılan
 * `[‹] Ay Yıl [›]` ay seçici. Store'daki summaryYear/summaryMonth state'ini
 * okur ve ileri/geri action'larını tetikler — her iki sheet ayrı bir ay
 * tutmaz, kullanıcı bir görünümde ay değiştirirse diğeri de o ayı yansıtır.
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useScheduleStore } from '../../stores';
import { useTheme } from '../../context';
import { PressableScale } from '../ui';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/**
 * `2026-05` veya benzer state'ten "Mayıs 2026" string'i üretir.
 * Sheet başlıklarında ve paylaşım mesajlarında ortak format için.
 */
export function formatSummaryMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES_TR[month - 1]} ${year}`;
}

export function MonthPicker() {
  const { colors } = useTheme();
  const summaryYear = useScheduleStore((state) => state.summaryYear);
  const summaryMonth = useScheduleStore((state) => state.summaryMonth);
  const goToPreviousSummaryMonth = useScheduleStore(
    (state) => state.goToPreviousSummaryMonth,
  );
  const goToNextSummaryMonth = useScheduleStore(
    (state) => state.goToNextSummaryMonth,
  );

  return (
    <View style={styles.row}>
      <PressableScale
        style={[styles.arrow, { backgroundColor: colors.surfaceSecondary }]}
        onPress={goToPreviousSummaryMonth}
        borderRadius={10}
        pressedScale={0.94}
        hitSlop={8}
      >
        <Text style={[styles.arrowText, { color: colors.text }]}>‹</Text>
      </PressableScale>
      <Text style={[styles.label, { color: colors.text }]}>
        {formatSummaryMonthLabel(summaryYear, summaryMonth)}
      </Text>
      <PressableScale
        style={[styles.arrow, { backgroundColor: colors.surfaceSecondary }]}
        onPress={goToNextSummaryMonth}
        borderRadius={10}
        pressedScale={0.94}
        hitSlop={8}
      >
        <Text style={[styles.arrowText, { color: colors.text }]}>›</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: -2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 140,
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
});
