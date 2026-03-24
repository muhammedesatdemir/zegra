/**
 * Generate Month Screen
 *
 * Create schedule for future months.
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useScheduleStore, selectActiveTemplate } from '../src/stores';
import { getMonthNameTR } from '../src/utils/turkish';
import { getCurrentYearMonth, getTodayISO } from '../src/utils/date';
import { useTheme } from '../src/context';
import { isOffCode } from '../src/constants/shifts';

type StartPoint = 'month_start' | 'today' | 'year_start';
type RangePreset = 'this_month' | 'next_3_months' | 'next_6_months' | 'until_year_end';

export default function GenerateScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const templates = useScheduleStore((state) => state.templates);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const activeTemplate = useScheduleStore(selectActiveTemplate);
  const generateMonth = useScheduleStore((state) => state.generateMonth);
  const setActiveTemplate = useScheduleStore((state) => state.setActiveTemplate);

  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  const today = getTodayISO();
  const todayDay = parseInt(today.split('-')[2], 10);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    activeTemplate?.id ?? null
  );
  const [startPoint, setStartPoint] = useState<StartPoint>('month_start');
  const [rangePreset, setRangePreset] = useState<RangePreset>('this_month');
  const [preserveLocked, setPreserveLocked] = useState(true);
  const [preserveManual, setPreserveManual] = useState(true);

  // Calculate months based on range preset
  const selectedMonths = useMemo(() => {
    const months: { year: number; month: number }[] = [];

    if (rangePreset === 'this_month') {
      months.push({ year: currentYear, month: currentMonth });
    } else if (rangePreset === 'next_3_months') {
      for (let i = 0; i < 3; i++) {
        let m = currentMonth + i;
        let y = currentYear;
        while (m > 12) {
          m -= 12;
          y += 1;
        }
        // Don't cross into next year for "next 3 months"
        if (y <= currentYear || rangePreset !== 'until_year_end') {
          months.push({ year: y, month: m });
        }
      }
    } else if (rangePreset === 'next_6_months') {
      for (let i = 0; i < 6; i++) {
        let m = currentMonth + i;
        let y = currentYear;
        while (m > 12) {
          m -= 12;
          y += 1;
        }
        months.push({ year: y, month: m });
      }
    } else if (rangePreset === 'until_year_end') {
      // Generate until December of current year - never cross into next year
      for (let m = currentMonth; m <= 12; m++) {
        months.push({ year: currentYear, month: m });
      }
    }

    return months;
  }, [rangePreset, currentYear, currentMonth]);

  // Helper to display shift pattern nicely
  const getShiftPatternDisplay = (steps: string[]): string => {
    return steps.slice(0, 8).map(code => {
      if (isOffCode(code)) return 'Off';
      const shift = shiftTypes.find(s => s.code === code);
      return shift?.shortName ?? code;
    }).join(' → ');
  };

  const handleCreateTemplate = () => {
    router.push('/templates/new');
  };

  const handleGenerate = () => {
    if (!selectedTemplateId) {
      Alert.alert('Hata', 'Lütfen bir şablon seçin.');
      return;
    }

    if (selectedMonths.length === 0) {
      Alert.alert('Hata', 'Lütfen bir dönem seçin.');
      return;
    }

    // Set active template if different
    if (selectedTemplateId !== activeTemplate?.id) {
      setActiveTemplate(selectedTemplateId);
    }

    let totalGenerated = 0;
    let totalSkipped = 0;

    // Sort months chronologically
    const sortedMonths = [...selectedMonths].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    for (const { year, month } of sortedMonths) {
      // Determine start day based on startPoint
      let startDay = 1;
      if (startPoint === 'today' && year === currentYear && month === currentMonth) {
        startDay = todayDay;
      } else if (startPoint === 'year_start' && month === 1) {
        startDay = 1;
      }

      const result = generateMonth(year, month, {
        preserveLocked,
        preserveManual,
        startDay,
      });
      totalGenerated += result.generated;
      totalSkipped += result.skipped;
    }

    const startPointText = startPoint === 'today' ? ' (bugünden itibaren)' :
                          startPoint === 'year_start' ? ' (yıl başından)' : '';

    Alert.alert(
      'Tamamlandı',
      `${totalGenerated} gün oluşturuldu${startPointText}${totalSkipped > 0 ? `, ${totalSkipped} gün atlandı` : ''}.`,
      [{ text: 'Tamam', onPress: () => router.back() }]
    );
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    section: { backgroundColor: colors.surface, borderColor: colors.border },
    sectionTitle: { color: colors.textMuted },
    templateName: { color: colors.text },
    templateCycle: { color: colors.textMuted },
    templatePattern: { color: colors.textSecondary },
    optionLabel: { color: colors.text },
    warningText: { color: colors.warningText, backgroundColor: colors.warning },
    cancelButton: { backgroundColor: colors.surface, borderColor: colors.border },
    cancelButtonText: { color: colors.textMuted },
  };

  const rangePresetLabels: Record<RangePreset, string> = {
    'this_month': 'Bu ay',
    'next_3_months': '3 ay',
    'next_6_months': '6 ay',
    'until_year_end': 'Yıl sonuna kadar',
  };

  const startPointLabels: Record<StartPoint, string> = {
    'month_start': 'Ay başından',
    'today': 'Bugünden',
    'year_start': 'Yıl başından',
  };

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      {/* Template Selection */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Şablon</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        {templates.map((template) => (
          <Pressable
            key={template.id}
            style={[
              styles.templateRow,
              { borderBottomColor: colors.borderLight },
              selectedTemplateId === template.id && styles.templateRowSelected,
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

      {/* Range Preset Selection */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Dönem</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <View style={styles.presetGrid}>
          {(Object.keys(rangePresetLabels) as RangePreset[]).map((preset) => (
            <Pressable
              key={preset}
              style={[
                styles.presetButton,
                { borderColor: colors.border },
                rangePreset === preset && styles.presetButtonSelected,
              ]}
              onPress={() => setRangePreset(preset)}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  { color: colors.text },
                  rangePreset === preset && styles.presetButtonTextSelected,
                ]}
              >
                {rangePresetLabels[preset]}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.rangeInfo, { color: colors.textMuted }]}>
          {selectedMonths.length > 0
            ? `${getMonthNameTR(selectedMonths[0].month)} ${selectedMonths[0].year}` +
              (selectedMonths.length > 1
                ? ` → ${getMonthNameTR(selectedMonths[selectedMonths.length - 1].month)} ${selectedMonths[selectedMonths.length - 1].year}`
                : '')
            : 'Dönem seçilmedi'}
          {rangePreset === 'until_year_end' && ` (${currentYear} yılı sonuna kadar)`}
        </Text>
      </View>

      {/* Start Point Selection */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Başlangıç Noktası</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <View style={styles.startPointGrid}>
          {(Object.keys(startPointLabels) as StartPoint[]).map((point) => (
            <Pressable
              key={point}
              style={[
                styles.startPointButton,
                { borderColor: colors.border },
                startPoint === point && styles.startPointButtonSelected,
              ]}
              onPress={() => setStartPoint(point)}
            >
              <Text
                style={[
                  styles.startPointButtonText,
                  { color: colors.text },
                  startPoint === point && styles.startPointButtonTextSelected,
                ]}
              >
                {startPointLabels[point]}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.startPointHint, { color: colors.textMuted }]}>
          {startPoint === 'month_start' && 'Her ayın 1\'inden itibaren doldurur'}
          {startPoint === 'today' && 'Bugünden itibaren doldurur, önceki günlere dokunmaz'}
          {startPoint === 'year_start' && '1 Ocak\'tan itibaren doldurur'}
        </Text>
      </View>

      {/* Options */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Seçenekler</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <Pressable
          style={[styles.optionRow, { borderBottomColor: colors.borderLight }]}
          onPress={() => setPreserveLocked(!preserveLocked)}
        >
          <Text style={[styles.optionLabel, dynamicStyles.optionLabel]}>
            Kilitli günleri koru
          </Text>
          <View
            style={[styles.checkbox, preserveLocked && styles.checkboxChecked]}
          >
            {preserveLocked && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
        </Pressable>
        <Pressable
          style={[styles.optionRow, { borderBottomColor: colors.borderLight }]}
          onPress={() => setPreserveManual(!preserveManual)}
        >
          <Text style={[styles.optionLabel, dynamicStyles.optionLabel]}>
            Manuel günleri koru
          </Text>
          <View
            style={[styles.checkbox, preserveManual && styles.checkboxChecked]}
          >
            {preserveManual && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
        </Pressable>
      </View>

      {/* Warning */}
      <View style={[styles.warning, { backgroundColor: colors.warning }]}>
        <Text style={[styles.warningText, { color: colors.warningText }]}>
          Mevcut planlar üzerine yazılacaktır
          {preserveLocked ? ' (kilitli olanlar hariç)' : ''}
          {preserveManual ? ' (manuel olanlar hariç)' : ''}
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
        <Pressable style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>
            {selectedMonths.length} Ay Oluştur
          </Text>
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
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  templateRowSelected: {
    backgroundColor: '#EFF6FF',
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
  checkmark: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  addTemplateRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  addTemplateText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  presetButtonTextSelected: {
    color: '#fff',
  },
  rangeInfo: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  startPointGrid: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  startPointButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  startPointButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  startPointButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  startPointButtonTextSelected: {
    color: '#fff',
  },
  startPointHint: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  generateButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
