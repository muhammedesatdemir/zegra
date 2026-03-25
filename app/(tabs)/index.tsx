/**
 * Home Screen (Ana Sayfa)
 *
 * Shows today's shift prominently with smart context.
 * Optimized for quick glance - minimal scroll needed.
 *
 * UX Goals:
 * - 1 saniyede okunmalı
 * - Minimum etkileşimle bilgi alınmalı
 * - Ekran dolu ama kalabalık değil hissetmeli
 * - "İyi tasarlanmış" ürün hissi vermeli
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useScheduleStore, selectTodayShift } from '../../src/stores';
import { formatDateTR, getTodayISO, addDaysToDate, parseISODate } from '../../src/utils/date';
import { useTheme } from '../../src/context';
import {
  TodayShiftCard,
  UpcomingDays,
  QuickActions,
  SmartInsight,
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
  const upcomingDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = addDaysToDate(today, i);
      const day = plannedDays[dateStr];
      const st = day ? shiftTypes.find((s) => s.code === day.shiftCode) : null;
      const dateObj = parseISODate(dateStr);
      const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(dateObj);

      days.push({
        date: dateStr,
        dayName,
        dayNum: dateObj.getDate(),
        plannedDay: day ?? null,
        shiftType: st ?? null,
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    return days;
  }, [today, plannedDays, shiftTypes]);

  // Calculate next working shift info (for context line)
  const nextWorkingShift = useMemo(() => {
    // Skip today, look for next working shift
    for (let i = 1; i <= 14; i++) {
      const dateStr = addDaysToDate(today, i);
      const day = plannedDays[dateStr];
      if (day) {
        const st = shiftTypes.find((s) => s.code === day.shiftCode);
        if (st?.isWorking) {
          const dateObj = parseISODate(dateStr);
          const dayLabel = i === 1
            ? 'Yarın'
            : new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(dateObj);
          return {
            dayLabel,
            shiftName: st.name,
            time: st.startTime ?? undefined,
            daysAway: i,
          };
        }
      }
    }
    return null;
  }, [today, plannedDays, shiftTypes]);

  // Calculate smart insight message
  const smartInsight = useMemo(() => {
    if (!todayShift) return null;

    const todaySt = shiftTypes.find((s) => s.code === todayShift.shiftCode);

    // Count consecutive working days
    let consecutiveWork = 0;
    if (todaySt?.isWorking) {
      for (let i = 0; i <= 7; i++) {
        const dateStr = addDaysToDate(today, i);
        const day = plannedDays[dateStr];
        const st = day ? shiftTypes.find((s) => s.code === day.shiftCode) : null;
        if (st?.isWorking) {
          consecutiveWork++;
        } else {
          break;
        }
      }
    }

    // Find next off day
    let nextOffDays = 0;
    for (let i = 1; i <= 14; i++) {
      const dateStr = addDaysToDate(today, i);
      const day = plannedDays[dateStr];
      const st = day ? shiftTypes.find((s) => s.code === day.shiftCode) : null;
      if (st && !st.isWorking) {
        nextOffDays = i;
        break;
      }
    }

    // Decide which insight to show
    if (consecutiveWork >= 3) {
      return {
        message: `${consecutiveWork} gün üst üste çalışıyorsun`,
        icon: '💪',
      };
    } else if (nextOffDays > 0 && nextOffDays <= 7) {
      const label = nextOffDays === 1 ? 'Yarın' : `${nextOffDays} gün sonra`;
      return {
        message: `Sonraki izin: ${label}`,
        icon: '🌴',
      };
    } else if (todaySt && !todaySt.isWorking && nextWorkingShift) {
      return {
        message: `Sonraki mesai: ${nextWorkingShift.dayLabel}`,
        icon: '📅',
      };
    }

    return null;
  }, [today, todayShift, plannedDays, shiftTypes, nextWorkingShift]);

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
      {/* Today's Shift - Hero Card with context */}
      <TodayShiftCard
        date={today}
        formattedDate={formatDateTR(parseISODate(today))}
        plannedDay={todayShift}
        shiftType={todayShiftType}
        nextWorkingShift={nextWorkingShift}
        onCreatePlan={() => router.push('/generate')}
      />

      {/* Smart Insight - Micro info line */}
      {smartInsight && (
        <SmartInsight message={smartInsight.message} icon={smartInsight.icon} />
      )}

      {/* Upcoming 7 Days Preview */}
      <UpcomingDays days={upcomingDays} />

      {/* Quick Actions - 2 buttons */}
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
