/**
 * Day Edit Screen
 *
 * Edit a single day's shift.
 * Modal presentation for quick editing.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScheduleStore } from '../../src/stores';
import { formatDateTR, parseISODate } from '../../src/utils/date';
import { useTheme } from '../../src/context';
import type { PlannedDay } from '../../src/types';

export default function DayEditScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const settings = useScheduleStore((state) => state.settings);
  const setPlannedDay = useScheduleStore((state) => state.setPlannedDay);
  const deleteDay = useScheduleStore((state) => state.deleteDay);

  const existingDay = date ? plannedDays[date] : null;

  const [selectedShiftCode, setSelectedShiftCode] = useState<string | null>(
    existingDay?.shiftCode ?? null
  );
  const [isLocked, setIsLocked] = useState(existingDay?.isLocked ?? false);
  const [note, setNote] = useState(existingDay?.note ?? '');
  const [showNote, setShowNote] = useState(!!existingDay?.note);

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    dateText: { color: colors.text },
    currentInfo: { backgroundColor: colors.surface },
    currentLabel: { color: colors.textMuted },
    currentValue: { color: colors.text },
    sourceText: { color: colors.textMuted },
    sectionTitle: { color: colors.textMuted },
    lockRow: { backgroundColor: colors.surface },
    lockLabel: { color: colors.text },
    lockHint: { color: colors.textMuted },
    noteInput: { backgroundColor: colors.surface, color: colors.text },
    cancelButton: { backgroundColor: colors.surface, borderColor: colors.border },
    cancelButtonText: { color: colors.textMuted },
  };

  if (!date) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Text style={{ color: colors.text }}>Geçersiz tarih</Text>
      </View>
    );
  }

  // Filter shift types - only show single OFF option (simpler UX)
  const visibleShiftTypes = shiftTypes.filter(
    (st) => !['OFF1', 'OFF2'].includes(st.code)
  );

  const handleSave = () => {
    if (!selectedShiftCode) {
      // If no shift selected and there's an existing day, delete it
      if (existingDay) {
        deleteDay(date);
      }
      router.back();
      return;
    }

    const newDay: PlannedDay = {
      date,
      shiftCode: selectedShiftCode,
      isLocked,
      source: 'manual',
      templateId: null,
      note: note.trim() || null,
    };

    setPlannedDay(newDay);
    router.back();
  };

  const handleDelete = () => {
    deleteDay(date);
    router.back();
  };

  const selectedShiftType = shiftTypes.find(
    (st) => st.code === selectedShiftCode
  );

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      {/* Date Header */}
      <Text style={[styles.dateText, dynamicStyles.dateText]}>{formatDateTR(parseISODate(date))}</Text>

      {/* Current Shift Info */}
      {existingDay && (
        <View style={[styles.currentInfo, dynamicStyles.currentInfo]}>
          <Text style={[styles.currentLabel, dynamicStyles.currentLabel]}>Mevcut:</Text>
          <Text style={[styles.currentValue, dynamicStyles.currentValue]}>
            {shiftTypes.find((st) => st.code === existingDay.shiftCode)?.name ??
              existingDay.shiftCode}
          </Text>
          {existingDay.source !== 'manual' && (
            <Text style={[styles.sourceText, dynamicStyles.sourceText]}>
              ({existingDay.source === 'generated' ? 'Şablondan' : 'Revize edilmiş'})
            </Text>
          )}
        </View>
      )}

      {/* Shift Selection */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Vardiya Seçin</Text>
      <View style={styles.shiftGrid}>
        {visibleShiftTypes.map((st) => (
          <Pressable
            key={st.id}
            style={[
              styles.shiftButton,
              { backgroundColor: st.color },
              selectedShiftCode === st.code && styles.shiftButtonSelected,
            ]}
            onPress={() => setSelectedShiftCode(st.code)}
          >
            <Text style={styles.shiftButtonName}>{st.name}</Text>
            {st.startTime && st.endTime && (
              <Text style={styles.shiftButtonTime}>
                {st.startTime} - {st.endTime}
              </Text>
            )}
            {selectedShiftCode === st.code && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* Lock Toggle */}
      <Pressable
        style={[styles.lockRow, dynamicStyles.lockRow]}
        onPress={() => setIsLocked(!isLocked)}
      >
        <View style={styles.lockInfo}>
          <Text style={[styles.lockLabel, dynamicStyles.lockLabel]}>Bu günü kilitle</Text>
          <Text style={[styles.lockHint, dynamicStyles.lockHint]}>
            Kilitli günler otomatik işlemlerden korunur
          </Text>
        </View>
        <View style={[styles.toggle, isLocked && styles.toggleActive]}>
          <View
            style={[styles.toggleKnob, isLocked && styles.toggleKnobActive]}
          />
        </View>
      </Pressable>

      {/* Note Section */}
      <Pressable
        style={styles.noteToggle}
        onPress={() => setShowNote(!showNote)}
      >
        <Text style={styles.noteToggleText}>
          {showNote ? '▼ Not' : '▶ Not ekle'}
        </Text>
      </Pressable>

      {showNote && (
        <TextInput
          style={[styles.noteInput, dynamicStyles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Not yazın..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={[styles.cancelButton, dynamicStyles.cancelButton]} onPress={() => router.back()}>
          <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>İptal</Text>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </Pressable>
      </View>

      {existingDay && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Bu Günü Sil</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  currentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sourceText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  shiftGrid: {
    gap: 8,
    marginBottom: 24,
  },
  shiftButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftButtonSelected: {
    borderWidth: 3,
    borderColor: '#1F2937',
  },
  shiftButtonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  shiftButtonTime: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  checkmark: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  lockInfo: {
    flex: 1,
  },
  lockLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  lockHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: '#E5E7EB',
    borderRadius: 15,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    backgroundColor: '#fff',
    borderRadius: 13,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  noteToggle: {
    padding: 12,
    marginBottom: 8,
  },
  noteToggleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#EF4444',
  },
});
