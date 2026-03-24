/**
 * Home Screen (Ana Sayfa)
 *
 * Shows today's shift prominently.
 * This is the first thing users see - must be FAST.
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useScheduleStore, selectTodayShift, selectShiftType } from '../../src/stores';
import { formatDateTR, getTodayISO, addDaysToDate } from '../../src/utils/date';
import { parseISODate } from '../../src/utils/date';
import { useTheme } from '../../src/context';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const today = getTodayISO();

  const todayShift = useScheduleStore(selectTodayShift);
  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const isLoading = useScheduleStore((state) => state.isLoading);

  // Get shift type details
  const shiftType = todayShift
    ? shiftTypes.find((st) => st.code === todayShift.shiftCode)
    : null;

  // Get next 7 days
  const nextDays = [];
  for (let i = 0; i < 7; i++) {
    const dateStr = addDaysToDate(today, i);
    const day = plannedDays[dateStr];
    const st = day ? shiftTypes.find((s) => s.code === day.shiftCode) : null;
    nextDays.push({
      date: dateStr,
      day,
      shiftType: st,
      isToday: i === 0,
    });
  }

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    dateText: { color: colors.textSecondary },
    sectionTitle: { color: colors.textSecondary },
    loading: { color: colors.textMuted },
    actionButton: { backgroundColor: colors.surface, borderColor: colors.border },
    actionButtonText: { color: colors.textSecondary },
  };

  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Text style={[styles.loading, dynamicStyles.loading]}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      {/* Today's Date */}
      <Text style={[styles.dateText, dynamicStyles.dateText]}>
        {formatDateTR(parseISODate(today))}
      </Text>

      {/* Today's Shift - Hero Card */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: shiftType?.color ?? '#E5E7EB' },
        ]}
      >
        {todayShift && shiftType ? (
          <>
            <Text style={styles.heroShiftName}>{shiftType.name}</Text>
            {shiftType.isWorking && shiftType.startTime && shiftType.endTime && (
              <Text style={styles.heroShiftTime}>
                {shiftType.startTime} - {shiftType.endTime}
                {shiftType.isOvernight && " (ertesi gün)"}
              </Text>
            )}
            {!shiftType.isWorking && (
              <Text style={styles.heroShiftTime}>Bugün izinlisiniz</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.heroShiftName}>Plan Yok</Text>
            <Text style={styles.heroShiftTime}>Henüz plan oluşturulmamış</Text>
            <Pressable
              style={styles.createButton}
              onPress={() => router.push('/generate')}
            >
              <Text style={styles.createButtonText}>Plan Oluştur</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Next 7 Days Preview */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Önümüzdeki 7 Gün</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekPreview}
      >
        {nextDays.map((item, index) => {
          const date = parseISODate(item.date);
          const dayName = new Intl.DateTimeFormat('tr-TR', {
            weekday: 'short',
          }).format(date);
          const dayNum = date.getDate();

          return (
            <Pressable
              key={item.date}
              style={[
                styles.dayCard,
                item.isToday && styles.dayCardToday,
                { backgroundColor: item.shiftType?.color ?? '#F3F4F6' },
              ]}
              onPress={() => router.push(`/day/${item.date}`)}
            >
              <Text
                style={[styles.dayName, item.isToday && styles.dayNameToday]}
              >
                {dayName}
              </Text>
              <Text
                style={[styles.dayNum, item.isToday && styles.dayNumToday]}
              >
                {dayNum}
              </Text>
              <Text style={styles.dayShift}>
                {item.shiftType?.shortName ?? '-'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, dynamicStyles.actionButton]}
          onPress={() => router.push('/calendar')}
        >
          <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText]}>Takvime Git</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, dynamicStyles.actionButton]}
          onPress={() => router.push('/generate')}
        >
          <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText]}>Ay Oluştur</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, dynamicStyles.actionButton]}
          onPress={() => router.push('/revise')}
        >
          <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText]}>Revize Et</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loading: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 50,
  },
  dateText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroShiftName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroShiftTime: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  createButton: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  weekPreview: {
    marginBottom: 24,
  },
  dayCard: {
    width: 64,
    height: 88,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  dayName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  dayNameToday: {
    color: '#fff',
  },
  dayNum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  dayNumToday: {
    color: '#fff',
  },
  dayShift: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});
