/**
 * Template Detail/Edit Screen
 *
 * View and edit a program template.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useScheduleStore } from '../../src/stores';
import { useTheme } from '../../src/context';

export default function TemplateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { colors } = useTheme();

  const templates = useScheduleStore((state) => state.templates);
  const allShiftTypes = useScheduleStore((state) => state.shiftTypes);

  // Show only single OFF option in UI - simpler UX
  const shiftTypes = allShiftTypes.filter(
    (st) => !['OFF1', 'OFF2'].includes(st.code)
  );
  const addTemplate = useScheduleStore((state) => state.addTemplate);
  const updateTemplate = useScheduleStore((state) => state.updateTemplate);
  const deleteTemplate = useScheduleStore((state) => state.deleteTemplate);

  const existingTemplate = templates.find((t) => t.id === id);

  const [name, setName] = useState(existingTemplate?.name ?? '');
  const [steps, setSteps] = useState<string[]>(
    existingTemplate?.steps ?? ['OFF', 'OFF', '0715', '0715', '1523', '1523', '2307', '2307']
  );
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isNew && !existingTemplate) {
      Alert.alert('Hata', 'Şablon bulunamadı.');
      router.back();
    }
  }, [isNew, existingTemplate]);

  const handleStepChange = (shiftCode: string) => {
    if (selectedStepIndex === null) return;

    const newSteps = [...steps];
    newSteps[selectedStepIndex] = shiftCode;
    setSteps(newSteps);
    setSelectedStepIndex(null);
  };

  const addStep = () => {
    setSteps([...steps, 'OFF']);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 2) {
      Alert.alert('Hata', 'En az 2 adım olmalıdır.');
      return;
    }
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    setSelectedStepIndex(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen bir isim girin.');
      return;
    }

    if (steps.length < 2) {
      Alert.alert('Hata', 'En az 2 adım olmalıdır.');
      return;
    }

    if (isNew) {
      addTemplate({
        name: name.trim(),
        cycleLength: steps.length,
        steps,
        isActive: false,
        isDefault: false,
      });
    } else if (existingTemplate) {
      updateTemplate(existingTemplate.id, {
        name: name.trim(),
        cycleLength: steps.length,
        steps,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!existingTemplate) return;

    if (existingTemplate.isDefault) {
      Alert.alert('Hata', 'Sistem şablonları silinemez.');
      return;
    }

    Alert.alert(
      'Şablonu Sil',
      `"${existingTemplate.name}" şablonunu silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteTemplate(existingTemplate.id);
            router.back();
          },
        },
      ]
    );
  };

  const getShiftColor = (code: string): string => {
    const shift = allShiftTypes.find((s) => s.code === code);
    return shift?.color ?? '#6B7280';
  };

  const getShiftShortName = (code: string): string => {
    const shift = allShiftTypes.find((s) => s.code === code);
    return shift?.shortName ?? code;
  };

  const isEditable = isNew || !existingTemplate?.isDefault;

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    section: { backgroundColor: colors.surface, borderColor: colors.border },
    sectionTitle: { color: colors.textMuted },
    nameInput: { color: colors.text },
    stepCard: { backgroundColor: colors.surface },
    stepIndex: { color: colors.textMuted },
    addStepCard: { borderColor: colors.border },
    addStepText: { color: colors.textMuted },
    hint: { color: colors.textMuted },
    shiftSelector: { backgroundColor: colors.surface, borderColor: colors.border },
    shiftOption: { backgroundColor: colors.surface },
    shiftOptionName: { color: colors.text },
    footer: { backgroundColor: colors.surface, borderTopColor: colors.border },
    cancelButton: { backgroundColor: colors.surface, borderColor: colors.border },
    cancelButtonText: { color: colors.textMuted },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ScrollView style={styles.content}>
        {/* Name Input */}
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>İsim</Text>
        <View style={[styles.section, dynamicStyles.section]}>
          <TextInput
            style={[styles.nameInput, dynamicStyles.nameInput]}
            value={name}
            onChangeText={setName}
            placeholder="Şablon adı"
            placeholderTextColor={colors.textMuted}
            editable={isEditable}
          />
        </View>

        {/* Cycle Steps */}
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
          Döngü ({steps.length} gün)
        </Text>
        <View style={[styles.section, dynamicStyles.section]}>
          <View style={styles.stepsGrid}>
            {steps.map((step, index) => (
              <Pressable
                key={index}
                style={[
                  styles.stepCard,
                  dynamicStyles.stepCard,
                  { borderColor: getShiftColor(step) },
                  selectedStepIndex === index && styles.stepCardSelected,
                ]}
                onPress={() => isEditable && setSelectedStepIndex(index)}
                onLongPress={() => isEditable && removeStep(index)}
              >
                <Text style={[styles.stepIndex, dynamicStyles.stepIndex]}>{index + 1}</Text>
                <View
                  style={[
                    styles.stepBadge,
                    { backgroundColor: getShiftColor(step) },
                  ]}
                >
                  <Text style={styles.stepCode}>{getShiftShortName(step)}</Text>
                </View>
              </Pressable>
            ))}
            {isEditable && (
              <Pressable style={[styles.addStepCard, dynamicStyles.addStepCard]} onPress={addStep}>
                <Text style={[styles.addStepText, dynamicStyles.addStepText]}>+</Text>
              </Pressable>
            )}
          </View>

          {isEditable && (
            <Text style={[styles.hint, dynamicStyles.hint]}>
              Dokunarak değiştirin, uzun basarak silin
            </Text>
          )}
        </View>

        {/* Shift Selector (when a step is selected) */}
        {selectedStepIndex !== null && (
          <>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
              {selectedStepIndex + 1}. Gün için Vardiya Seçin
            </Text>
            <View style={[styles.shiftSelector, dynamicStyles.shiftSelector]}>
              {shiftTypes.map((shift) => (
                <Pressable
                  key={shift.id}
                  style={[
                    styles.shiftOption,
                    dynamicStyles.shiftOption,
                    { borderColor: shift.color },
                  ]}
                  onPress={() => handleStepChange(shift.code)}
                >
                  <View
                    style={[
                      styles.shiftOptionBadge,
                      { backgroundColor: shift.color },
                    ]}
                  >
                    <Text style={styles.shiftOptionCode}>{shift.shortName}</Text>
                  </View>
                  <Text style={[styles.shiftOptionName, dynamicStyles.shiftOptionName]}>{shift.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Preview */}
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Önizleme</Text>
        <View style={[styles.section, dynamicStyles.section]}>
          <View style={styles.previewRow}>
            {steps.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.previewDay,
                  { backgroundColor: getShiftColor(step) },
                ]}
              >
                <Text style={styles.previewDayText}>
                  {getShiftShortName(step)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delete Button */}
        {!isNew && isEditable && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Şablonu Sil</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Actions */}
      {isEditable && (
        <View style={[styles.footer, dynamicStyles.footer]}>
          <Pressable style={[styles.cancelButton, dynamicStyles.cancelButton]} onPress={() => router.back()}>
            <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>İptal</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {isNew ? 'Oluştur' : 'Kaydet'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  nameInput: {
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepCard: {
    width: 60,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  stepCardSelected: {
    backgroundColor: '#EFF6FF',
  },
  stepIndex: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  addStepCard: {
    width: 60,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStepText: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  shiftSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  shiftOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
    gap: 8,
  },
  shiftOptionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftOptionCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  shiftOptionName: {
    fontSize: 14,
    color: '#1F2937',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 4,
  },
  previewDay: {
    flex: 1,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDayText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
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
});
