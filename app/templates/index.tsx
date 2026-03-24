/**
 * Template List Screen
 *
 * View and manage program templates.
 */

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useScheduleStore, selectActiveTemplate } from '../../src/stores';
import { useTheme } from '../../src/context';
import { isOffCode } from '../../src/constants/shifts';

export default function TemplatesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const templates = useScheduleStore((state) => state.templates);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const activeTemplate = useScheduleStore(selectActiveTemplate);
  const setActiveTemplate = useScheduleStore((state) => state.setActiveTemplate);

  // Display shift pattern with readable names
  const getShiftSequenceDisplay = (steps: string[]): string => {
    return steps.slice(0, 8).map(code => {
      if (isOffCode(code)) return 'Off';
      const shift = shiftTypes.find(s => s.code === code);
      return shift?.shortName ?? code;
    }).join(' → ');
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    templateCard: { backgroundColor: colors.surface, borderColor: colors.border },
    templateName: { color: colors.text },
    templateCycle: { color: colors.textMuted },
    sequenceLabel: { color: colors.textMuted },
    sequenceText: { color: colors.textSecondary },
    templateActions: { borderTopColor: colors.borderLight },
    defaultLabel: { color: colors.textMuted },
    footer: { backgroundColor: colors.surface, borderTopColor: colors.border },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ScrollView style={styles.list}>
        {templates.map((template) => {
          const isActive = template.id === activeTemplate?.id;

          return (
            <Pressable
              key={template.id}
              style={[
                styles.templateCard,
                dynamicStyles.templateCard,
                isActive && styles.templateCardActive,
              ]}
              onPress={() => router.push(`/templates/${template.id}`)}
            >
              <View style={styles.templateHeader}>
                <View style={styles.templateInfo}>
                  <Text style={[styles.templateName, dynamicStyles.templateName]}>
                    {template.name}
                  </Text>
                  <Text style={[styles.templateCycle, dynamicStyles.templateCycle]}>
                    {template.cycleLength} günlük döngü
                  </Text>
                </View>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Aktif</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.sequenceLabel, dynamicStyles.sequenceLabel]}>Döngü:</Text>
              <Text style={[styles.sequenceText, dynamicStyles.sequenceText]}>
                {getShiftSequenceDisplay(template.steps)}
              </Text>

              <View style={[styles.templateActions, dynamicStyles.templateActions]}>
                {!isActive && (
                  <Pressable
                    style={styles.setActiveButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveTemplate(template.id);
                    }}
                  >
                    <Text style={styles.setActiveButtonText}>Aktif Yap</Text>
                  </Pressable>
                )}
                {template.isDefault && (
                  <Text style={[styles.defaultLabel, dynamicStyles.defaultLabel]}>
                    Sistem şablonu
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, dynamicStyles.footer]}>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/templates/new')}
        >
          <Text style={styles.addButtonText}>+ Yeni Şablon</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  templateCardActive: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  templateCycle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  sequenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  sequenceText: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  setActiveButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  setActiveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
