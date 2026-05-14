/**
 * NotesSheet
 *
 * Seçili aya ait kayıtlı notları liste halinde gösteren büyük modal/sheet.
 * Mesai Özeti sheet'iyle aynı `summaryYear`/`summaryMonth` state'ini paylaşır
 * (MonthPicker ortak component) — kullanıcı bir görünümde ay değiştirince
 * diğeri de o ayı yansıtır.
 *
 * Veri modeli değişmez: zaten `PlannedDay.note` alanında tutulan kullanıcı
 * notlarını okur, sadece o ayın dolu (whitespace dışı içerikli) notlarını
 * tarihe göre azalan sırada listeler.
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
import { formatDateTR, parseISODate } from '../../utils/date';
import { PressableScale } from '../ui';
import { MonthPicker, formatSummaryMonthLabel } from './MonthPicker';

interface NotesSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface MonthlyNote {
  date: string; // ISO
  formattedDate: string;
  note: string;
}

export function NotesSheet({ visible, onClose }: NotesSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const summaryYear = useScheduleStore((state) => state.summaryYear);
  const summaryMonth = useScheduleStore((state) => state.summaryMonth);
  const resetSummaryToCurrentMonth = useScheduleStore(
    (state) => state.resetSummaryToCurrentMonth,
  );

  // SummarySheet ile aynı kural: sheet her açıldığında varsayılan deneyim
  // olarak "bugünün ayı"na sıfırla. Kullanıcı session içinde gezinmiş olsa da
  // tekrar açtığında doğal davranış bekler.
  useEffect(() => {
    if (visible) {
      resetSummaryToCurrentMonth();
    }
  }, [visible, resetSummaryToCurrentMonth]);

  const monthLabel = formatSummaryMonthLabel(summaryYear, summaryMonth);

  // Seçili aya ait dolu notları topla. Performans için tüm plannedDays
  // taranır ama sadece YYYY-MM- prefix eşleşmesi ile filtre. Boş/whitespace
  // notlar dahil edilmez. Yeni tarih üstte olacak şekilde sırala.
  const notes = useMemo<MonthlyNote[]>(() => {
    const prefix = `${summaryYear}-${String(summaryMonth).padStart(2, '0')}-`;
    const result: MonthlyNote[] = [];
    for (const date in plannedDays) {
      if (!date.startsWith(prefix)) continue;
      const day = plannedDays[date];
      const trimmed = day?.note?.trim();
      if (!trimmed) continue;
      result.push({
        date,
        formattedDate: formatDateTR(parseISODate(date)),
        note: trimmed,
      });
    }
    result.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return result;
  }, [plannedDays, summaryYear, summaryMonth]);

  const hasNotes = notes.length > 0;

  // Notlar uzun olabileceği için Mesai Özeti'nin küçük sheet yapısı yerine
  // ekranın büyük bir kısmını kaplayan modal kullanıyoruz. Üstten/alttan
  // safe area dışında bir tampon bırakıp kalan alanı sheet'e veriyoruz.
  const sheetMaxHeight = windowHeight - insets.top - 40;
  const sheetMinHeight = Math.min(windowHeight * 0.8, sheetMaxHeight);

  const MIN_ANDROID_GAP = 24;
  const safeBottomPadding = Math.max(
    insets.bottom + 16,
    Platform.OS === 'android' ? MIN_ANDROID_GAP : 16,
  );

  const handleShare = async () => {
    if (!hasNotes) return;
    const body = notes
      .map((n) => {
        // Tarih başlığı için kısa Türkçe biçim: "13.05.2026". Liste içinde
        // uzun format kullanıyoruz ama paylaşımda kısa ve okunur olsun.
        const [y, m, d] = n.date.split('-');
        return `${d}.${m}.${y}\n${n.note}`;
      })
      .join('\n\n');
    const message = `${monthLabel} Notları\n\n${body}`;
    try {
      await Share.share({ message });
    } catch (error) {
      if (__DEV__) {
        console.error('[NotesSheet] Share failed:', error);
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
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              maxHeight: sheetMaxHeight,
              minHeight: sheetMinHeight,
              paddingBottom: safeBottomPadding,
            },
          ]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.text }]}>
            {monthLabel} Notları
          </Text>

          <MonthPicker />

          {/* Notlar uzun olabileceği için sheet içinde ayrı bir scroll alanı.
              Alt buton grubu sheet altında sabit kalır, sadece liste kayar. */}
          {hasNotes ? (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              {notes.map((n) => (
                <View
                  key={n.date}
                  style={[
                    styles.noteCard,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.noteDate, { color: colors.primary }]}>
                    {n.formattedDate}
                  </Text>
                  <Text style={[styles.noteBody, { color: colors.text }]}>
                    {n.note}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Bu ay için kayıtlı not bulunmuyor.
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <PressableScale
              style={[
                styles.button,
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
              style={[
                styles.button,
                styles.buttonPrimary,
                !hasNotes && styles.buttonDisabled,
              ]}
              onPress={handleShare}
              borderRadius={12}
              pressedScale={hasNotes ? 0.98 : 1}
              rippleColor="rgba(255,255,255,0.22)"
              disabled={!hasNotes}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                📤 Paylaş
              </Text>
            </PressableScale>
          </View>
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
    paddingHorizontal: 20,
    // alt butonlar sabit kalsın diye flex yapı: handle + başlık + picker +
    // scroll alan + actions. ScrollView flex:1 ile büyür/küçülür.
    flex: 0,
    flexDirection: 'column',
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 4,
    gap: 10,
  },
  noteCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteDate: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
    textTransform: 'capitalize',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 20,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
});
