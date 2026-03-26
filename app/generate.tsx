/**
 * Generate Month Screen - Modern & Premium
 *
 * Yeni plan oluşturma ekranı.
 * Hızlı, net, güçlü ve sade tasarım.
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useScheduleStore, selectActiveTemplate } from '../src/stores';
import { getMonthNameTR } from '../src/utils/turkish';
import { getCurrentYearMonth, getTodayISO } from '../src/utils/date';
import { useTheme } from '../src/context';
import { isOffCode } from '../src/constants/shifts';

type StartPoint = 'month_start' | 'today' | 'year_start';
type RangePreset = 'this_month' | 'next_3_months' | 'next_6_months' | 'until_year_end';

// Şablon için kullanıcı dostu isim ve açıklama oluştur
function getTemplateDisplayInfo(template: { name: string; steps: string[]; cycleLength: number }, shiftTypes: any[]) {
  const { name, steps, cycleLength } = template;

  // İzin günü sayısını hesapla
  const offDays = steps.filter(code => isOffCode(code)).length;
  const workDays = cycleLength - offDays;

  // Shift pattern'i analiz et
  const getShiftName = (code: string): string => {
    if (isOffCode(code)) return 'İzin';
    const shift = shiftTypes.find(s => s.code === code);
    if (!shift) return code;
    // Türkçe karakter düzeltmeleri
    const n = shift.name.toLowerCase();
    if (n.includes('sabah') || n.includes('morning')) return 'Sabah';
    if (n.includes('öğle') || n.includes('ogle') || n.includes('afternoon')) return 'Öğle';
    if (n.includes('akşam') || n.includes('aksam') || n.includes('evening')) return 'Akşam';
    if (n.includes('gece') || n.includes('night')) return 'Gece';
    return shift.shortName || code;
  };

  // Grupla ve say
  const groups: { name: string; count: number }[] = [];
  let currentShift = '';
  let currentCount = 0;

  for (const code of steps) {
    const shiftName = getShiftName(code);
    if (shiftName === currentShift) {
      currentCount++;
    } else {
      if (currentShift) {
        groups.push({ name: currentShift, count: currentCount });
      }
      currentShift = shiftName;
      currentCount = 1;
    }
  }
  if (currentShift) {
    groups.push({ name: currentShift, count: currentCount });
  }

  // Açıklama oluştur (örn: "2 izin → 2 sabah → 2 öğle → 2 gece")
  const description = groups
    .map(g => `${g.count} ${g.name.toLowerCase()}`)
    .join(' → ');

  // Kullanıcı dostu başlık
  let friendlyName = name;
  if (name.startsWith('BYG-') || name.match(/^[A-Z]+-[A-Z0-9]+$/)) {
    friendlyName = `Standart ${cycleLength} Gün Döngü`;
  }

  return {
    title: friendlyName,
    subtitle: `${cycleLength} günlük döngü • ${workDays} iş, ${offDays} izin`,
    pattern: description,
  };
}

export default function GenerateScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

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
        months.push({ year: y, month: m });
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
      for (let m = currentMonth; m <= 12; m++) {
        months.push({ year: currentYear, month: m });
      }
    }

    return months;
  }, [rangePreset, currentYear, currentMonth]);

  const handleCreateTemplate = () => {
    router.push('/templates/new');
  };

  const handleGenerate = () => {
    if (!selectedTemplateId) {
      Alert.alert('Şablon Seçilmedi', 'Lütfen bir şablon seçin.');
      return;
    }

    if (selectedMonths.length === 0) {
      Alert.alert('Dönem Seçilmedi', 'Lütfen bir dönem seçin.');
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

      if (startPoint === 'today') {
        // Sadece bu ay ve bugün için bugünden başla
        if (year === currentYear && month === currentMonth) {
          startDay = todayDay;
        }
        // Diğer aylar için 1'den başla (normal davranış)
      } else if (startPoint === 'year_start') {
        // BUG FIX: Yıl başından seçildiğinde
        // Seçilen dönemin İLK ayından başla, her ay 1'den
        // Bu zaten doğru çalışıyor, startDay = 1
        startDay = 1;
      }
      // month_start için zaten startDay = 1

      const result = generateMonth(year, month, {
        preserveLocked,
        preserveManual,
        startDay,
      });
      totalGenerated += result.generated;
      totalSkipped += result.skipped;
    }

    // Başarı mesajı
    const monthText = selectedMonths.length === 1 ? 'ay' : 'ay';
    let message = `${totalGenerated} gün oluşturuldu.`;
    if (totalSkipped > 0) {
      message += `\n${totalSkipped} gün korundu.`;
    }

    Alert.alert(
      'Plan Oluşturuldu ✓',
      message,
      [{ text: 'Tamam', onPress: () => router.back() }]
    );
  };

  // Dönem butonları için bilgi
  const rangeOptions: { key: RangePreset; label: string; subLabel?: string }[] = [
    { key: 'this_month', label: 'Bu Ay' },
    { key: 'next_3_months', label: '3 Ay' },
    { key: 'next_6_months', label: '6 Ay' },
    { key: 'until_year_end', label: 'Yıl Sonu' },
  ];

  // Başlangıç noktası seçenekleri
  const startOptions: { key: StartPoint; label: string; description: string }[] = [
    {
      key: 'month_start',
      label: 'Ay Başından',
      description: 'Her ayın 1\'inden başlar'
    },
    {
      key: 'today',
      label: 'Bugünden',
      description: 'Bugünden itibaren doldurur'
    },
    {
      key: 'year_start',
      label: 'Yıl Başından',
      description: 'Döngüyü Ocak\'tan hesaplar'
    },
  ];

  // Seçili şablon
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ========== ŞABLON SEÇİMİ ========== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Vardiya Şablonu
        </Text>

        <View style={styles.templateGrid}>
          {templates.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            const info = getTemplateDisplayInfo(template, shiftTypes);

            return (
              <Pressable
                key={template.id}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  isSelected && styles.templateCardSelected,
                ]}
                onPress={() => setSelectedTemplateId(template.id)}
              >
                {/* Seçili göstergesi */}
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}

                <Text style={[
                  styles.templateTitle,
                  { color: colors.text },
                  isSelected && { color: colors.primary }
                ]}>
                  {info.title}
                </Text>

                <Text style={[styles.templateSubtitle, { color: colors.textMuted }]}>
                  {info.subtitle}
                </Text>

                <View style={[styles.patternContainer, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.templatePattern, { color: colors.textSecondary }]}>
                    {info.pattern}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Yeni Şablon Oluştur - Hero Card */}
        <Pressable
          style={[styles.createTemplateCard, { borderColor: colors.primary }]}
          onPress={handleCreateTemplate}
        >
          <View style={styles.createTemplateContent}>
            <View style={[styles.createTemplateIcon, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.createTemplateIconText, { color: colors.primary }]}>+</Text>
            </View>
            <View style={styles.createTemplateText}>
              <Text style={[styles.createTemplateTitle, { color: colors.primary }]}>
                Kendi Düzenini Oluştur
              </Text>
              <Text style={[styles.createTemplateSubtitle, { color: colors.textMuted }]}>
                Özel vardiya döngüsü tasarla
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* ========== DÖNEM SEÇİMİ ========== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Dönem
        </Text>

        <View style={[styles.rangeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rangeGrid}>
            {rangeOptions.map((option) => {
              const isSelected = rangePreset === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.rangeButton,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setRangePreset(option.key)}
                >
                  <Text style={[
                    styles.rangeButtonText,
                    { color: isSelected ? '#FFFFFF' : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Dönem özeti */}
          <View style={[styles.rangeSummary, { borderTopColor: colors.borderLight }]}>
            <Text style={[styles.rangeSummaryText, { color: colors.textSecondary }]}>
              {selectedMonths.length > 0
                ? selectedMonths.length === 1
                  ? `${getMonthNameTR(selectedMonths[0].month)} ${selectedMonths[0].year}`
                  : `${getMonthNameTR(selectedMonths[0].month)} → ${getMonthNameTR(selectedMonths[selectedMonths.length - 1].month)} ${selectedMonths[selectedMonths.length - 1].year}`
                : 'Dönem seçilmedi'}
            </Text>
            <Text style={[styles.rangeSummaryCount, { color: colors.primary }]}>
              {selectedMonths.length} ay
            </Text>
          </View>
        </View>
      </View>

      {/* ========== BAŞLANGIÇ NOKTASI ========== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Başlangıç Noktası
        </Text>

        <View style={[styles.startCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.startGrid}>
            {startOptions.map((option) => {
              const isSelected = startPoint === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.startButton,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setStartPoint(option.key)}
                >
                  <Text style={[
                    styles.startButtonText,
                    { color: isSelected ? '#FFFFFF' : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.startHint, { color: colors.textMuted }]}>
            {startOptions.find(o => o.key === startPoint)?.description}
          </Text>
        </View>
      </View>

      {/* ========== SEÇENEKLER ========== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Koruma Seçenekleri
        </Text>

        <View style={[styles.optionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Kilitli günler */}
          <Pressable
            style={[styles.optionRow, { borderBottomColor: colors.borderLight }]}
            onPress={() => setPreserveLocked(!preserveLocked)}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Sabitlediğim günleri koru
              </Text>
              <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                🔒 işaretli günler değiştirilmez
              </Text>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: preserveLocked ? colors.primary : colors.surfaceSecondary }
            ]}>
              <View style={[
                styles.toggleKnob,
                preserveLocked && styles.toggleKnobActive
              ]} />
            </View>
          </Pressable>

          {/* Manuel günler */}
          <Pressable
            style={styles.optionRow}
            onPress={() => setPreserveManual(!preserveManual)}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Elle değiştirdiğim günleri koru
              </Text>
              <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                Önceden düzenlediğin günler korunur
              </Text>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: preserveManual ? colors.primary : colors.surfaceSecondary }
            ]}>
              <View style={[
                styles.toggleKnob,
                preserveManual && styles.toggleKnobActive
              ]} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* ========== UYARI ========== */}
      <View style={[styles.warningBox, { backgroundColor: colors.warning }]}>
        <Text style={[styles.warningIcon]}>⚠️</Text>
        <Text style={[styles.warningText, { color: colors.warningText }]}>
          Yeni plan, mevcut planların üzerine yazılır.
        </Text>
      </View>

      {/* ========== BUTONLAR ========== */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>
            İptal
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.generateButton,
            !selectedTemplateId && styles.generateButtonDisabled
          ]}
          onPress={handleGenerate}
          disabled={!selectedTemplateId}
        >
          <Text style={styles.generateButtonText}>
            {selectedMonths.length === 1 ? '1 Ay' : `${selectedMonths.length} Ay`} Oluştur
          </Text>
        </Pressable>
      </View>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Template Cards
  templateGrid: {
    gap: 12,
  },
  templateCard: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  templateCardSelected: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  templateTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  patternContainer: {
    padding: 10,
    borderRadius: 8,
  },
  templatePattern: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Create Template Hero Card
  createTemplateCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  createTemplateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createTemplateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  createTemplateIconText: {
    fontSize: 28,
    fontWeight: '300',
  },
  createTemplateText: {
    flex: 1,
  },
  createTemplateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  createTemplateSubtitle: {
    fontSize: 13,
  },

  // Range Selection
  rangeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  rangeGrid: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  rangeSummaryText: {
    fontSize: 14,
  },
  rangeSummaryCount: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Start Point
  startCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  startGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  startButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  startHint: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Options
  optionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },

  // Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  warningText: {
    fontSize: 14,
    flex: 1,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  bottomPadding: {
    height: 40,
  },
});
