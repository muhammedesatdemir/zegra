/**
 * Day Edit Screen
 *
 * Edit a single day's shift, time, note, and protection status.
 * Premium, user-friendly design with clear Turkish language.
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScheduleStore } from '../../src/stores';
import { formatDateTR, parseISODate, isValidISODate } from '../../src/utils/date';
import { normalizeCustomTime } from '../../src/utils/shiftTime';
import { useTheme } from '../../src/context';
import type { PlannedDay } from '../../src/types';

export default function DayEditScreen() {
  const { date: rawDate } = useLocalSearchParams<{ date: string }>();
  // Validate ISO format — parseISODate throws on invalid input which would
  // crash the screen if a malformed path param is ever passed.
  const date = rawDate && isValidISODate(rawDate) ? rawDate : null;
  const router = useRouter();
  const { colors } = useTheme();

  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const setPlannedDay = useScheduleStore((state) => state.setPlannedDay);
  const deleteDay = useScheduleStore((state) => state.deleteDay);

  const existingDay = date ? plannedDays[date] : null;

  // Form state
  const [selectedShiftCode, setSelectedShiftCode] = useState<string | null>(
    existingDay?.shiftCode ?? null
  );
  const [isProtected, setIsProtected] = useState(existingDay?.isLocked ?? false);
  const [note, setNote] = useState(existingDay?.note ?? '');
  const [customStartTime, setCustomStartTime] = useState(existingDay?.customStartTime ?? '');
  const [customEndTime, setCustomEndTime] = useState(existingDay?.customEndTime ?? '');

  // Get selected shift type details
  const selectedShiftType = useMemo(() => {
    return shiftTypes.find((st) => st.code === selectedShiftCode) ?? null;
  }, [shiftTypes, selectedShiftCode]);

  // Filter shift types - only show single OFF option
  const visibleShiftTypes = useMemo(() => {
    return shiftTypes.filter((st) => !['OFF1', 'OFF2'].includes(st.code));
  }, [shiftTypes]);

  // Parse date for display
  const dateObj = date ? parseISODate(date) : new Date();
  const formattedDate = date ? formatDateTR(dateObj) : '';
  const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(dateObj);

  // Get existing shift type for summary
  const existingShiftType = existingDay
    ? shiftTypes.find((st) => st.code === existingDay.shiftCode)
    : null;

  if (!date) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Geçersiz tarih</Text>
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
            Geri
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = () => {
    if (!selectedShiftCode) {
      if (existingDay) {
        deleteDay(date);
      }
      router.back();
      return;
    }

    // Normalize custom times - don't store if same as default
    const normalizedStart = normalizeCustomTime(
      customStartTime.trim(),
      selectedShiftType?.startTime ?? null
    );
    const normalizedEnd = normalizeCustomTime(
      customEndTime.trim(),
      selectedShiftType?.endTime ?? null
    );

    // Preserve cycleIndex and templateId if the shift code did not change —
    // this keeps month-to-month phase continuity correct when only the note
    // or custom times are edited.
    const shiftUnchanged =
      !!existingDay && existingDay.shiftCode === selectedShiftCode;

    const newDay: PlannedDay = {
      date,
      shiftCode: selectedShiftCode,
      isLocked: isProtected,
      source: 'manual',
      templateId: shiftUnchanged && existingDay ? existingDay.templateId : null,
      note: note.trim() || null,
      customStartTime: normalizedStart,
      customEndTime: normalizedEnd,
      ...(shiftUnchanged && existingDay && existingDay.cycleIndex !== undefined
        ? { cycleIndex: existingDay.cycleIndex }
        : {}),
    };

    setPlannedDay(newDay);
    router.back();
  };

  const handleClear = () => {
    deleteDay(date);
    router.back();
  };

  const handleShiftSelect = (code: string) => {
    setSelectedShiftCode(code);
    // Reset custom times when changing shift
    setCustomStartTime('');
    setCustomEndTime('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Day Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryMain}>
            <Text style={[styles.summaryDate, { color: colors.text }]}>
              {formattedDate}
            </Text>
            <Text style={[styles.summaryDay, { color: colors.textSecondary }]}>
              {dayName}
            </Text>
          </View>
          {existingShiftType && (
            <View style={[styles.summaryBadge, { backgroundColor: existingShiftType.color }]}>
              <Text style={styles.summaryBadgeText}>{existingShiftType.name}</Text>
            </View>
          )}
          {existingDay?.isLocked && (
            <Text style={styles.summaryProtectedIcon}>🛡️</Text>
          )}
        </View>

        {/* Shift Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Vardiya Seçin
        </Text>
        <View style={styles.shiftGrid}>
          {visibleShiftTypes.map((st) => {
            const isSelected = selectedShiftCode === st.code;
            return (
              <Pressable
                key={st.id}
                style={({ pressed }) => [
                  styles.shiftCard,
                  { backgroundColor: st.color },
                  isSelected && styles.shiftCardSelected,
                  pressed && styles.shiftCardPressed,
                ]}
                onPress={() => handleShiftSelect(st.code)}
              >
                <View style={styles.shiftCardContent}>
                  <Text style={styles.shiftName}>{st.name}</Text>
                  {st.startTime && st.endTime && (
                    <Text style={styles.shiftTime}>
                      {st.startTime} – {st.endTime}
                    </Text>
                  )}
                  {!st.isWorking && (
                    <Text style={styles.shiftOffLabel}>İzin günü</Text>
                  )}
                </View>
                {isSelected && (
                  <View style={styles.checkContainer}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Time Editor - Only for working shifts */}
        {selectedShiftType?.isWorking && (
          <View style={[styles.timeSection, { backgroundColor: colors.surface }]}>
            <View style={styles.timeSectionHeader}>
              <Text style={[styles.timeSectionTitle, { color: colors.text }]}>
                Bu Güne Özel Saat
              </Text>
              <Text style={[styles.timeSectionHint, { color: colors.textMuted }]}>
                Sadece bu gün için geçerli
              </Text>
            </View>
            <View style={styles.timeInputs}>
              <View style={styles.timeInputGroup}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  Başlangıç
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    { backgroundColor: colors.surfaceSecondary, color: colors.text },
                  ]}
                  value={customStartTime}
                  onChangeText={setCustomStartTime}
                  placeholder={selectedShiftType.startTime ?? '00:00'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <Text style={[styles.timeSeparator, { color: colors.textMuted }]}>–</Text>
              <View style={styles.timeInputGroup}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  Bitiş
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    { backgroundColor: colors.surfaceSecondary, color: colors.text },
                  ]}
                  value={customEndTime}
                  onChangeText={setCustomEndTime}
                  placeholder={selectedShiftType.endTime ?? '00:00'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
            {(customStartTime || customEndTime) && (
              <Pressable
                style={styles.resetTimesButton}
                onPress={() => {
                  setCustomStartTime('');
                  setCustomEndTime('');
                }}
              >
                <Text style={[styles.resetTimesText, { color: colors.primary }]}>
                  Varsayılana döndür
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Protection Toggle */}
        <Pressable
          style={[styles.protectRow, { backgroundColor: colors.surface }]}
          onPress={() => setIsProtected(!isProtected)}
        >
          <View style={styles.protectInfo}>
            <View style={styles.protectHeader}>
              <Text style={styles.protectIcon}>🛡️</Text>
              <Text style={[styles.protectLabel, { color: colors.text }]}>
                Bu Günü Koru
              </Text>
            </View>
            <Text style={[styles.protectHint, { color: colors.textMuted }]}>
              Plan oluştururken bu gün otomatik değişmesin
            </Text>
          </View>
          <View style={[styles.toggle, isProtected && styles.toggleActive]}>
            <View style={[styles.toggleKnob, isProtected && styles.toggleKnobActive]} />
          </View>
        </Pressable>

        {/* Note Section */}
        <View style={[styles.noteSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.noteSectionTitle, { color: colors.text }]}>
            📝 Not
          </Text>
          <TextInput
            style={[
              styles.noteInput,
              { backgroundColor: colors.surfaceSecondary, color: colors.text },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Bugüne özel not ekle..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={[styles.noteHint, { color: colors.textMuted }]}>
            Örn: İzin değişti, nöbet kaydırıldı...
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              İptal
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </Pressable>
        </View>

        {/* Clear Day Option */}
        {existingDay && (
          <Pressable
            style={({ pressed }) => [
              styles.clearButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>Günü Temizle</Text>
          </Pressable>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryMain: {
    flex: 1,
  },
  summaryDate: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  summaryDay: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  summaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  summaryProtectedIcon: {
    fontSize: 18,
  },

  // Section Title
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },

  // Shift Grid
  shiftGrid: {
    gap: 10,
    marginBottom: 20,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  shiftCardSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowOpacity: 0.2,
    elevation: 5,
  },
  shiftCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  shiftCardContent: {
    flex: 1,
  },
  shiftName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  shiftTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  shiftOffLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },

  // Time Section
  timeSection: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  timeSectionHeader: {
    marginBottom: 12,
  },
  timeSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  timeSectionHint: {
    fontSize: 12,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  timeInput: {
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 18,
  },
  resetTimesButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  resetTimesText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Protection Toggle
  protectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  protectInfo: {
    flex: 1,
  },
  protectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  protectIcon: {
    fontSize: 16,
  },
  protectLabel: {
    fontSize: 15,
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  protectHint: {
    fontSize: 12,
    marginLeft: 22,
  },
  toggle: {
    width: 52,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },

  // Note Section
  noteSection: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  noteSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  noteInput: {
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    minHeight: 80,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
  noteHint: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  saveButton: {
    flex: 1.2,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  // Clear Button
  clearButton: {
    padding: 14,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 20,
  },
});
