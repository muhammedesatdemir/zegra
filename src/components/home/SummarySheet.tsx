/**
 * SummarySheet
 *
 * Mevcut ay için fazla mesai ve eksik saat toplamlarını gösteren bottom
 * sheet. Paylaş butonuyla sistem paylaşım menüsünü açar.
 *
 * Kural: Fazla mesai ve eksik saat ayrı tutulur — birbirinden mahsup
 * edilmez, net mesai/ücret hesabı yapılmaz.
 */

import { useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Share,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore } from '../../stores';
import { useTheme } from '../../context';
import { formatDurationTR, sumMonthDurations } from '../../utils/duration';
import { PressableScale } from '../ui';
import { MonthPicker, formatSummaryMonthLabel } from './MonthPicker';

interface SummarySheetProps {
  visible: boolean;
  onClose: () => void;
}

export function SummarySheet({ visible, onClose }: SummarySheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const summaryYear = useScheduleStore((state) => state.summaryYear);
  const summaryMonth = useScheduleStore((state) => state.summaryMonth);
  const resetSummaryToCurrentMonth = useScheduleStore(
    (state) => state.resetSummaryToCurrentMonth,
  );

  // Sheet her açıldığında "bugünün ayı"na sıfırlıyoruz. Session içinde
  // kullanıcı oklarla geziniyor olsa bile, modal kapanıp tekrar açılınca
  // varsayılan deneyim (içinde bulunulan ay) korunsun.
  useEffect(() => {
    if (visible) {
      resetSummaryToCurrentMonth();
    }
  }, [visible, resetSummaryToCurrentMonth]);

  // Seçili ay için fazla mesai ve eksik saat toplamları.
  // sumMonthDurations zaten (year, month) parametresi alıyor — eklediğimiz
  // tek şey state-driven year/month.
  const { overtime, shortage } = useMemo(() => {
    return sumMonthDurations(plannedDays, summaryYear, summaryMonth);
  }, [plannedDays, summaryYear, summaryMonth]);

  const monthLabel = formatSummaryMonthLabel(summaryYear, summaryMonth);

  // Paylaşım mesajında da seçili ayı kullanıyoruz (sadece o ayın özeti
  // paylaşılır — kullanıcının o an gördüğü değerle birebir aynı).

  // Sistem navigation bar / home indicator için minimum güvenli boşluk.
  // Android üç-tuşlu çubukta insets.bottom 0 dönebildiği için ekstra
  // tampon ekliyoruz. iOS home indicator'da insets.bottom ~34 gelir.
  const MIN_ANDROID_GAP = 24;
  const safeBottomPadding = Math.max(
    insets.bottom + 16,
    Platform.OS === 'android' ? MIN_ANDROID_GAP : 16,
  );

  // Sheet içeriği büyürse (uzun ay isimleri vs) ekranı taşmasın.
  // Üstte sistem statusbar ve sayfa içeriği için makul bir tampon bırakıyoruz.
  const sheetMaxHeight = windowHeight - insets.top - 64;

  const handleShare = async () => {
    const message =
      `${monthLabel} Mesai Özeti:\n` +
      `Toplam fazla mesai: ${formatDurationTR(overtime)}\n` +
      `Toplam eksik saat: ${formatDurationTR(shortage)}`;

    try {
      await Share.share({ message });
    } catch (error) {
      if (__DEV__) {
        console.error('[SummarySheet] Share failed:', error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Backdrop tap closes; inner Pressable absorbs taps so sheet stays open */}
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, maxHeight: sheetMaxHeight },
          ]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: safeBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[styles.title, { color: colors.text }]}>
              Mesai Özeti
            </Text>

            {/* Ortak MonthPicker — Aylık Notlar sheet'i de aynısını kullanır.
                Store'daki summaryYear/summaryMonth state'ini paylaştığımız için
                bir görünümde ay değiştirmek diğerinde de senkron kalır. */}
            <MonthPicker />

            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
                <Text style={styles.icon}>⏫</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                  Toplam Fazla Mesai
                </Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>
                  {formatDurationTR(overtime)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B20' }]}>
                <Text style={styles.icon}>⏬</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                  Toplam Eksik Saat
                </Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>
                  {formatDurationTR(shortage)}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <PressableScale
                style={[
                  styles.button,
                  styles.buttonSecondary,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={onClose}
                borderRadius={12}
                pressedScale={0.98}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Kapat
                </Text>
              </PressableScale>
              <PressableScale
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleShare}
                borderRadius={12}
                pressedScale={0.98}
                rippleColor="rgba(255,255,255,0.22)"
              >
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                  📤 Paylaş
                </Text>
              </PressableScale>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    // paddingBottom dinamik olarak insets.bottom + 16 (Android min 24) ile
    // override edilir; buton grubu sistem nav bar ile çakışmasın diye.
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '700',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  divider: {
    height: 1,
    opacity: 0.5,
    marginVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    // bg dynamic
  },
  buttonPrimary: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
});
