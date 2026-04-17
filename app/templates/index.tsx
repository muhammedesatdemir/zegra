/**
 * Template List Screen
 *
 * View and manage program templates.
 * Modernized to match the template selection pattern used in Generate screen.
 */

import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore, selectActiveTemplate } from '../../src/stores';
import { useTheme } from '../../src/context';
import { isOffCode } from '../../src/constants/shifts';
import { PressableScale } from '../../src/components/ui';
import type { ShiftType } from '../../src/types';

// Friendly display info for a template (title, subtitle, pattern)
function getTemplateDisplayInfo(
  template: { name: string; steps: string[]; cycleLength: number },
  shiftTypes: ShiftType[]
) {
  const { name, steps, cycleLength } = template;

  const offDays = steps.filter((code) => isOffCode(code)).length;
  const workDays = cycleLength - offDays;

  const getShiftName = (code: string): string => {
    if (isOffCode(code)) return 'İzin';
    const shift = shiftTypes.find((s) => s.code === code);
    if (!shift) return code;
    const n = shift.name.toLowerCase();
    if (n.includes('sabah') || n.includes('morning')) return 'Sabah';
    if (n.includes('öğle') || n.includes('ogle') || n.includes('afternoon')) return 'Öğle';
    if (n.includes('akşam') || n.includes('aksam') || n.includes('evening')) return 'Akşam';
    if (n.includes('gece') || n.includes('night')) return 'Gece';
    return shift.shortName || code;
  };

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

  const pattern = groups
    .map((g) => `${g.count} ${g.name.toLowerCase()}`)
    .join(' → ');

  let friendlyName = name;
  if (name.startsWith('BYG-') || name.match(/^[A-Z]+-[A-Z0-9]+$/)) {
    friendlyName = `Standart ${cycleLength} Gün Döngü`;
  }

  return {
    title: friendlyName,
    subtitle: `${cycleLength} günlük döngü • ${workDays} iş, ${offDays} izin`,
    pattern,
  };
}

export default function TemplatesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const templates = useScheduleStore((state) => state.templates);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const activeTemplate = useScheduleStore(selectActiveTemplate);
  const setActiveTemplate = useScheduleStore((state) => state.setActiveTemplate);

  const handleCardPress = (templateId: string) => {
    setActiveTemplate(templateId);
  };

  const handleEdit = (templateId: string) => {
    router.push(`/templates/${templateId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 96 + Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introBlock}>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Aktif Şablon
          </Text>
          <Text style={[styles.introSubtitle, { color: colors.textMuted }]}>
            Kullandığınız vardiya düzenini seçin. Bu seçim plan oluşturma ve
            varsayılan akışta kullanılır.
          </Text>
        </View>

        {/* Templates */}
        <View style={styles.list}>
          {templates.map((template) => {
            const info = getTemplateDisplayInfo(template, shiftTypes);
            const isActive = template.id === activeTemplate?.id;
            const isSystem = template.isDefault;

            return (
              <PressableScale
                key={template.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderWidth: isActive ? 2 : 1,
                  },
                  isActive && styles.cardActive,
                ]}
                onPress={() => handleCardPress(template.id)}
                borderRadius={16}
                pressedScale={0.98}
                rippleColor="rgba(59,130,246,0.10)"
              >
                {/* Active indicator */}
                {isActive && (
                  <View
                    style={[styles.activeBadge, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.activeBadgeCheck}>✓</Text>
                  </View>
                )}

                {/* Title */}
                <Text
                  style={[
                    styles.title,
                    { color: colors.text },
                    isActive && { color: colors.primary },
                  ]}
                  numberOfLines={2}
                >
                  {info.title}
                </Text>

                {/* Subtitle */}
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {info.subtitle}
                </Text>

                {/* Pattern */}
                <View
                  style={[
                    styles.patternContainer,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Text
                    style={[styles.patternText, { color: colors.textSecondary }]}
                  >
                    {info.pattern}
                  </Text>
                </View>

                {/* Footer row: source tag + edit */}
                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.sourceTag,
                      isSystem
                        ? {
                            backgroundColor: isDark
                              ? 'rgba(148,163,184,0.18)'
                              : '#F1F5F9',
                          }
                        : {
                            backgroundColor: isDark
                              ? 'rgba(139,92,246,0.18)'
                              : 'rgba(139,92,246,0.10)',
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sourceTagText,
                        {
                          color: isSystem
                            ? colors.textMuted
                            : isDark
                              ? '#C4B5FD'
                              : '#7C3AED',
                        },
                      ]}
                    >
                      {isSystem ? 'Sistem şablonu' : 'Özel şablon'}
                    </Text>
                  </View>

                  <PressableScale
                    style={[
                      styles.editButton,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                    onPress={() => handleEdit(template.id)}
                    borderRadius={8}
                    pressedScale={0.95}
                    rippleColor="rgba(59,130,246,0.12)"
                    hitSlop={6}
                  >
                    <Text
                      style={[styles.editButtonText, { color: colors.textSecondary }]}
                    >
                      {isSystem ? 'Görüntüle' : 'Düzenle'}
                    </Text>
                  </PressableScale>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <PressableScale
          style={styles.addButton}
          onPress={() => router.push('/templates/new')}
          borderRadius={14}
          pressedScale={0.98}
          rippleColor="rgba(255,255,255,0.22)"
        >
          <Text style={styles.addButtonText}>+ Yeni Şablon</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  introBlock: {
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  introSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
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
  cardActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    paddingRight: 32, // leave room for active badge
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  patternContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  patternText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sourceTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sourceTagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
