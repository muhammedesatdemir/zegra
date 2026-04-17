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
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore, selectActiveTemplate } from '../src/stores';
import { PressableScale } from '../src/components/ui';
import { getMonthNameTR } from '../src/utils/turkish';
import { getCurrentYearMonth, getTodayISO } from '../src/utils/date';
import { useTheme } from '../src/context';
import { isOffCode } from '../src/constants/shifts';

type StartPoint = 'month_start' | 'today';
type RangePreset = 'this_month' | 'next_3_months' | 'next_6_months' | 'until_year_end';

// Success modal state tipi
interface SuccessModalState {
  visible: boolean;
  generated: number;
  skipped: number;
}

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

// ============================================
// SUCCESS MODAL COMPONENT
// ============================================

interface SuccessModalProps {
  visible: boolean;
  generated: number;
  skipped: number;
  onClose: () => void;
}

function SuccessModal({ visible, generated, skipped, onClose }: SuccessModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={successModalStyles.overlay}>
        <View style={[successModalStyles.container, { backgroundColor: colors.surface }]}>
          {/* Success Icon */}
          <View style={successModalStyles.iconContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={successModalStyles.iconGradient}
            >
              <Text style={successModalStyles.iconText}>✓</Text>
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={[successModalStyles.title, { color: colors.text }]}>
            Plan Hazır
          </Text>

          {/* Stats */}
          <View style={successModalStyles.statsContainer}>
            <View style={[successModalStyles.statBox, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[successModalStyles.statNumber, { color: colors.primary }]}>
                {generated}
              </Text>
              <Text style={[successModalStyles.statLabel, { color: colors.textMuted }]}>
                gün oluşturuldu
              </Text>
            </View>

            {skipped > 0 && (
              <View style={[successModalStyles.statBox, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[successModalStyles.statNumber, { color: '#F59E0B' }]}>
                  {skipped}
                </Text>
                <Text style={[successModalStyles.statLabel, { color: colors.textMuted }]}>
                  gün korundu
                </Text>
              </View>
            )}
          </View>

          {/* Action Button */}
          <PressableScale
            style={successModalStyles.button}
            onPress={onClose}
            rippleColor="rgba(255,255,255,0.2)"
            borderRadius={14}
          >
            <Text style={successModalStyles.buttonText}>Tamam</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const successModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    width: '100%',
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
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

// ============================================
// MAIN COMPONENT
// ============================================

export default function GenerateScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
  const [preserveCustomDays, setPreserveCustomDays] = useState(true);

  // Success modal state
  const [successModal, setSuccessModal] = useState<SuccessModalState>({
    visible: false,
    generated: 0,
    skipped: 0,
  });

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
      // Simple alert for validation errors only
      return;
    }

    if (selectedMonths.length === 0) {
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
      }
      // month_start için zaten startDay = 1, phaseOffset hesaplanmaz (otomatik)

      const result = generateMonth(year, month, {
        preserveLocked: preserveCustomDays,
        preserveManual: preserveCustomDays,
        startDay,
      });
      totalGenerated += result.generated;
      totalSkipped += result.skipped;
    }

    // Success modal'ı göster
    setSuccessModal({
      visible: true,
      generated: totalGenerated,
      skipped: totalSkipped,
    });
  };

  const handleSuccessModalClose = () => {
    setSuccessModal({ visible: false, generated: 0, skipped: 0 });
    router.back();
  };

  // Dönem butonları için bilgi
  const rangeOptions: { key: RangePreset; label: string; subLabel?: string }[] = [
    { key: 'this_month', label: 'Bu Ay' },
    { key: 'next_3_months', label: '3 Ay' },
    { key: 'next_6_months', label: '6 Ay' },
    { key: 'until_year_end', label: 'Yıl Sonu' },
  ];

  // Başlangıç noktası seçenekleri (2 buton - simetrik)
  const startOptions: { key: StartPoint; label: string; description: string }[] = [
    {
      key: 'month_start',
      label: 'Ay Başından',
      description: 'Önceki aydan devam eder'
    },
    {
      key: 'today',
      label: 'Bugünden',
      description: 'Bugünden itibaren doldurur'
    },
  ];

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
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
                <PressableScale
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
                  borderRadius={16}
                  pressedScale={0.98}
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
                </PressableScale>
              );
            })}
          </View>

          {/* Yeni Şablon Oluştur - Premium Hero Card */}
          <PressableScale
            style={styles.createTemplateCard}
            onPress={handleCreateTemplate}
            borderRadius={16}
            pressedScale={0.98}
            rippleColor="rgba(99, 102, 241, 0.14)"
          >
            <LinearGradient
              colors={isDark
                ? ['#1E3A5F', '#2D1B4E', '#1E3A5F']
                : ['#EEF2FF', '#F5F3FF', '#EFF6FF']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createTemplateGradient}
            >
              <View style={styles.createTemplateContent}>
                <LinearGradient
                  colors={['#3B82F6', '#8B5CF6']}
                  style={styles.createTemplateIcon}
                >
                  <Text style={styles.createTemplateIconText}>+</Text>
                </LinearGradient>
                <View style={styles.createTemplateText}>
                  <Text style={[
                    styles.createTemplateTitle,
                    { color: isDark ? '#93C5FD' : '#3B82F6' }
                  ]}>
                    Kendi Düzenini Oluştur
                  </Text>
                  <Text style={[
                    styles.createTemplateSubtitle,
                    { color: isDark ? '#A5B4FC' : '#6366F1' }
                  ]}>
                    Özel vardiya döngüsü tasarla
                  </Text>
                </View>
                <Text style={[
                  styles.createTemplateArrow,
                  { color: isDark ? '#93C5FD' : '#3B82F6' }
                ]}>
                  →
                </Text>
              </View>
            </LinearGradient>
          </PressableScale>
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
                  <PressableScale
                    key={option.key}
                    style={[
                      styles.rangeButton,
                      {
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setRangePreset(option.key)}
                    borderRadius={10}
                    pressedScale={0.96}
                    rippleColor={isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(59,130,246,0.10)'}
                  >
                    <Text style={[
                      styles.rangeButtonText,
                      { color: isSelected ? '#FFFFFF' : colors.text }
                    ]}>
                      {option.label}
                    </Text>
                  </PressableScale>
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
            <View style={styles.startGridTwo}>
              {startOptions.map((option) => {
                const isSelected = startPoint === option.key;
                return (
                  <PressableScale
                    key={option.key}
                    style={[
                      styles.startButtonPremium,
                      {
                        backgroundColor: isSelected ? colors.primary : '#F1F5F9',
                      },
                      isSelected && styles.startButtonPremiumSelected,
                    ]}
                    onPress={() => setStartPoint(option.key)}
                    borderRadius={12}
                    pressedScale={0.97}
                    rippleColor={isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(59,130,246,0.10)'}
                  >
                    <Text style={[
                      styles.startButtonTextPremium,
                      { color: isSelected ? '#FFFFFF' : '#334155' }
                    ]}>
                      {option.label}
                    </Text>
                  </PressableScale>
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
            <PressableScale
              style={styles.optionRowSingle}
              onPress={() => setPreserveCustomDays(!preserveCustomDays)}
              borderRadius={16}
              pressedScale={0.99}
              pressedOpacity={0.96}
            >
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  Özel ayarladığım günleri koru
                </Text>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  Elle değiştirdiğiniz veya sabitlediğiniz günler korunur
                </Text>
              </View>
              <View style={[
                styles.toggle,
                { backgroundColor: preserveCustomDays ? colors.primary : colors.surfaceSecondary }
              ]}>
                <View style={[
                  styles.toggleKnob,
                  preserveCustomDays && styles.toggleKnobActive
                ]} />
              </View>
            </PressableScale>
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
          <PressableScale
            style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
            borderRadius={14}
            pressedScale={0.98}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>
              İptal
            </Text>
          </PressableScale>

          <PressableScale
            style={[
              styles.generateButton,
              !selectedTemplateId && styles.generateButtonDisabled
            ]}
            onPress={handleGenerate}
            disabled={!selectedTemplateId}
            borderRadius={14}
            pressedScale={0.98}
            rippleColor="rgba(255,255,255,0.22)"
          >
            <Text style={styles.generateButtonText}>
              {selectedMonths.length === 1 ? '1 Ay' : `${selectedMonths.length} Ay`} Oluştur
            </Text>
          </PressableScale>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <SuccessModal
        visible={successModal.visible}
        generated={successModal.generated}
        skipped={successModal.skipped}
        onClose={handleSuccessModalClose}
      />
    </>
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

  // Create Template Hero Card - Premium Design
  createTemplateCard: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  createTemplateCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createTemplateGradient: {
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 16,
  },
  createTemplateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createTemplateIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  createTemplateIconText: {
    fontSize: 26,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  createTemplateText: {
    flex: 1,
  },
  createTemplateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  createTemplateSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  createTemplateArrow: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
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
  startGridTwo: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  startButtonPremium: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonPremiumSelected: {
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  startButtonTextPremium: {
    fontSize: 14,
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
  optionRowSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
