/**
 * Home Screen (Ana Sayfa)
 *
 * Shows today's shift prominently.
 * Optimized for quick glance - no scroll needed.
 *
 * UX Goals:
 * - 1 saniyede okunmalı
 * - Minimum etkileşimle bilgi alınmalı
 * - Karmaşıklık sıfıra yakın olmalı
 * - Dikey scroll gerektirmeden dengeli görünmeli
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useScheduleStore, selectTodayShift } from '../../src/stores';
import { formatDateTR, getTodayISO, addDaysToDate, parseISODate } from '../../src/utils/date';
import { useTheme } from '../../src/context';
import {
  TodayShiftCard,
  UpcomingDays,
  QuickActions,
} from '../../src/components/home';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const today = getTodayISO();

  const todayShift = useScheduleStore(selectTodayShift);
  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const isLoading = useScheduleStore((state) => state.isLoading);

  // Get shift type details for today
  const todayShiftType = todayShift
    ? shiftTypes.find((st) => st.code === todayShift.shiftCode)
    : null;

  // Prepare upcoming 7 days data
  const upcomingDays = [];
  for (let i = 0; i < 7; i++) {
    const dateStr = addDaysToDate(today, i);
    const day = plannedDays[dateStr];
    const st = day ? shiftTypes.find((s) => s.code === day.shiftCode) : null;
    const dateObj = parseISODate(dateStr);
    const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(dateObj);

    upcomingDays.push({
      date: dateStr,
      dayName,
      dayNum: dateObj.getDate(),
      plannedDay: day ?? null,
      shiftType: st ?? null,
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }

  // Quick actions - only 2 essential actions
  const quickActions = [
    {
      id: 'calendar',
      icon: '📅',
      label: 'Takvim',
      subtitle: 'Aylık görünüm',
      onPress: () => router.push('/calendar'),
    },
    {
      id: 'generate',
      icon: '✨',
      label: 'Plan Oluştur',
      subtitle: 'Yeni ay ekle',
      onPress: () => router.push('/generate'),
    },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Today's Shift - Hero Card */}
      <TodayShiftCard
        date={today}
        formattedDate={formatDateTR(parseISODate(today))}
        plannedDay={todayShift}
        shiftType={todayShiftType}
        onCreatePlan={() => router.push('/generate')}
      />

      {/* Upcoming 7 Days Preview */}
      <UpcomingDays days={upcomingDays} />

      {/* Quick Actions - 2 buttons only */}
      <QuickActions actions={quickActions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 12,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
});
