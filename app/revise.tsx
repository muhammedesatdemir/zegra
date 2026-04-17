/**
 * Revise Range Screen
 *
 * Apply bulk changes to a date range.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore, selectActiveTemplate } from '../src/stores';
import { getMonthNameTR } from '../src/utils/turkish';
import { getDayCount } from '../src/utils/date';
import { useTheme } from '../src/context';
import { isOffCode } from '../src/constants/shifts';

type RevisionMode = 'single_shift' | 'from_template';

// Helper to format year-month-day to ISO string
function formatISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function ReviseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const templates = useScheduleStore((state) => state.templates);
  const activeTemplate = useScheduleStore(selectActiveTemplate);
  const reviseRange = useScheduleStore((state) => state.reviseRange);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Selection state
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [mode, setMode] = useState<RevisionMode>('single_shift');
  const [selectedShiftCode, setSelectedShiftCode] = useState<string | null>(
    null
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    activeTemplate?.id ?? null
  );
  const [overrideLocked, setOverrideLocked] = useState(false);
  const [overrideManual, setOverrideManual] = useState(true);

  // Calendar state for date selection
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(currentMonth);

  const daysInMonth = getDayCount(viewYear, viewMonth);
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Filter visible shifts - only show one Off option
  const visibleShiftTypes = shiftTypes.filter(
    (st) => !['OFF1', 'OFF2'].includes(st.code)
  );

  // Helper to display shift pattern nicely
  const getShiftPatternDisplay = (steps: string[]): string => {
    return steps.slice(0, 8).map(code => {
      if (isOffCode(code)) return 'Off';
      const shift = shiftTypes.find(s => s.code === code);
      return shift?.shortName ?? code;
    }).join(' → ');
  };

  const handleDateSelect = (day: number) => {
    const dateStr = formatISODate(viewYear, viewMonth, day);

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(dateStr);
      setEndDate(null);
    } else {
      // Complete selection
      if (dateStr < startDate) {
        setEndDate(startDate);
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const isDateInRange = (day: number): boolean => {
    if (!startDate) return false;
    const dateStr = formatISODate(viewYear, viewMonth, day);
    if (!endDate) return dateStr === startDate;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isStartDate = (day: number): boolean => {
    if (!startDate) return false;
    return formatISODate(viewYear, viewMonth, day) === startDate;
  };

  const isEndDate = (day: number): boolean => {
    if (!endDate) return false;
    return formatISODate(viewYear, viewMonth, day) === endDate;
  };

  const navigateMonth = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const handleCreateTemplate = () => {
    router.push('/templates/new');
  };

  const handleRevise = () => {
    if (!startDate || !endDate) {
      Alert.alert('Hata', 'Lütfen bir tarih aralığı seçin.');
      return;
    }

    if (mode === 'single_shift' && !selectedShiftCode) {
      Alert.alert('Hata', 'Lütfen bir vardiya seçin.');
      return;
    }

    if (mode === 'from_template' && !selectedTemplateId) {
      Alert.alert('Hata', 'Lütfen bir şablon seçin.');
      return;
    }

    const result = reviseRange({
      startDate,
      endDate,
      mode,
      shiftCode: mode === 'single_shift' ? selectedShiftCode! : undefined,
      templateId: mode === 'from_template' ? selectedTemplateId! : undefined,
      phaseOffset: 0,
      overrideLocked,
      overrideManual,
    });

    Alert.alert(
      'Tamamlandı',
      `${result.revised} gün güncellendi${result.skipped > 0 ? `, ${result.skipped} gün atlandı` : ''}.`,
      [{ text: 'Tamam', onPress: () => router.back() }]
    );
  };

  const formatSelectedRange = (): string => {
    if (!startDate) return 'Tarih seçin';
    if (!endDate) return startDate;
    return `${startDate} → ${endDate}`;
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    section: { backgroundColor: colors.surface, borderColor: colors.border },
    sectionTitle: { color: colors.textMuted },
    selectedRange: { color: colors.text },
    monthNavTitle: { color: colors.text },
    dayHeader: { color: colors.textMuted },
    dayText: { color: colors.text },
    modeLabel: { color: colors.text },
    templateName: { color: colors.text },
    templateCycle: { color: colors.textMuted },
    templatePattern: { color: colors.textSecondary },
    optionLabel: { color: colors.text },
    cancelButton: { backgroundColor: colors.surface, borderColor: colors.border },
    cancelButtonText: { color: colors.textMuted },
  };

  return (
    <ScrollView
      style={[styles.container, dynamicStyles.container]}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
    >
      {/* Date Range Selection */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Tarih Aralığı</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <Text style={[styles.selectedRange, dynamicStyles.selectedRange]}>{formatSelectedRange()}</Text>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable
            style={styles.monthNavButton}
            onPress={() => navigateMonth(-1)}
          >
            <Text style={styles.monthNavText}>{'<'}</Text>
          </Pressable>
          <Text style={[styles.monthNavTitle, dynamicStyles.monthNavTitle]}>
            {getMonthNameTR(viewMonth)} {viewYear}
          </Text>
          <Pressable
            style={styles.monthNavButton}
            onPress={() => navigateMonth(1)}
          >
            <Text style={styles.monthNavText}>{'>'}</Text>
          </Pressable>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((d) => (
            <Text key={d} style={[styles.dayHeader, dynamicStyles.dayHeader]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {Array.from({ length: startOffset }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const inRange = isDateInRange(day);
            const isStart = isStartDate(day);
            const isEnd = isEndDate(day);

            return (
              <Pressable
                key={day}
                style={[
                  styles.dayCell,
                  inRange && styles.dayCellInRange,
                  isStart && styles.dayCellStart,
                  isEnd && styles.dayCellEnd,
                ]}
                onPress={() => handleDateSelect(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    dynamicStyles.dayText,
                    inRange && styles.dayTextInRange,
                    (isStart || isEnd) && styles.dayTextStartEnd,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Mode Selection */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Değişiklik Türü</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <Pressable
          style={[
            styles.modeRow,
            { borderBottomColor: colors.borderLight },
            mode === 'single_shift' && styles.modeRowSelected,
          ]}
          onPress={() => setMode('single_shift')}
        >
          <Text style={[styles.modeLabel, dynamicStyles.modeLabel]}>Tek vardiya ata</Text>
          {mode === 'single_shift' && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
        <Pressable
          style={[
            styles.modeRow,
            { borderBottomColor: colors.borderLight },
            mode === 'from_template' && styles.modeRowSelected,
          ]}
          onPress={() => setMode('from_template')}
        >
          <Text style={[styles.modeLabel, dynamicStyles.modeLabel]}>Şablondan oluştur</Text>
          {mode === 'from_template' && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
      </View>

      {/* Shift Selection (single_shift mode) */}
      {mode === 'single_shift' && (
        <>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Vardiya</Text>
          <View style={styles.shiftGrid}>
            {visibleShiftTypes.map((shift) => (
              <Pressable
                key={shift.id}
                style={[
                  styles.shiftCard,
                  { borderColor: shift.color },
                  selectedShiftCode === shift.code && {
                    backgroundColor: shift.color,
                  },
                ]}
                onPress={() => setSelectedShiftCode(shift.code)}
              >
                <Text
                  style={[
                    styles.shiftCode,
                    selectedShiftCode === shift.code && styles.shiftCodeSelected,
                  ]}
                >
                  {shift.shortName}
                </Text>
                <Text
                  style={[
                    styles.shiftName,
                    selectedShiftCode === shift.code && styles.shiftNameSelected,
                  ]}
                >
                  {shift.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Template Selection (from_template mode) */}
      {mode === 'from_template' && (
        <>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Şablon</Text>
          <View style={[styles.section, dynamicStyles.section]}>
            {templates.map((template) => (
              <Pressable
                key={template.id}
                style={[
                  styles.templateRow,
                  { borderBottomColor: colors.borderLight },
                  selectedTemplateId === template.id &&
                    styles.templateRowSelected,
                ]}
                onPress={() => setSelectedTemplateId(template.id)}
              >
                <View style={styles.templateInfo}>
                  <Text style={[styles.templateName, dynamicStyles.templateName]}>
                    {template.name}
                  </Text>
                  <Text style={[styles.templateCycle, dynamicStyles.templateCycle]}>
                    {template.cycleLength} günlük döngü
                  </Text>
                  <Text style={[styles.templatePattern, dynamicStyles.templatePattern]}>
                    {getShiftPatternDisplay(template.steps)}
                  </Text>
                </View>
                {selectedTemplateId === template.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}

            {/* Add New Template Button */}
            <Pressable
              style={[styles.addTemplateRow, { borderBottomColor: colors.borderLight }]}
              onPress={handleCreateTemplate}
            >
              <Text style={styles.addTemplateText}>+ Yeni Şablon Oluştur</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Options */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Seçenekler</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <Pressable
          style={[styles.optionRow, { borderBottomColor: colors.borderLight }]}
          onPress={() => setOverrideLocked(!overrideLocked)}
        >
          <Text style={[styles.optionLabel, dynamicStyles.optionLabel]}>
            Kilitli günlerin üzerine yaz
          </Text>
          <View
            style={[styles.checkbox, overrideLocked && styles.checkboxChecked]}
          >
            {overrideLocked && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
        </Pressable>
        <Pressable
          style={[styles.optionRow, { borderBottomColor: colors.borderLight }]}
          onPress={() => setOverrideManual(!overrideManual)}
        >
          <Text style={[styles.optionLabel, dynamicStyles.optionLabel]}>
            Manuel günlerin üzerine yaz
          </Text>
          <View
            style={[styles.checkbox, overrideManual && styles.checkboxChecked]}
          >
            {overrideManual && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
        </Pressable>
      </View>

      {/* Warning */}
      <View style={[styles.warning, { backgroundColor: colors.warning }]}>
        <Text style={[styles.warningText, { color: colors.warningText }]}>
          Seçili aralıktaki mevcut planlar{' '}
          {overrideLocked ? '' : '(kilitli olanlar hariç) '}
          üzerine yazılacaktır
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.cancelButton, dynamicStyles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>
            İptal
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.reviseButton,
            (!startDate || !endDate) && styles.reviseButtonDisabled,
          ]}
          onPress={handleRevise}
          disabled={!startDate || !endDate}
        >
          <Text style={styles.reviseButtonText}>Uygula</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 16,
  },
  selectedRange: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavButton: {
    padding: 8,
  },
  monthNavText: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
  monthNavTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInRange: {
    backgroundColor: '#DBEAFE',
  },
  dayCellStart: {
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  dayCellEnd: {
    backgroundColor: '#3B82F6',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  dayText: {
    fontSize: 14,
  },
  dayTextInRange: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  dayTextStartEnd: {
    color: '#fff',
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modeRowSelected: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  modeLabel: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  shiftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  shiftCard: {
    width: '30%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  shiftCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  shiftCodeSelected: {
    color: '#fff',
  },
  shiftName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  shiftNameSelected: {
    color: '#fff',
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  templateRowSelected: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
  },
  templateCycle: {
    fontSize: 13,
    marginTop: 2,
  },
  templatePattern: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  addTemplateRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  addTemplateText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  warning: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviseButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  reviseButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  reviseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
