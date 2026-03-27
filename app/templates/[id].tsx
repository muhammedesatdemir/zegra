/**
 * Template Detail/Edit Screen
 *
 * View and edit a program template.
 * Premium UI/UX with modern interactions.
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useScheduleStore } from '../../src/stores';
import { useTheme } from '../../src/context';

// ============================================
// CUSTOM ALERT MODAL
// ============================================

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }>;
  onClose: () => void;
}

function AlertModal({ visible, title, message, buttons, onClose }: AlertModalProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleButtonPress = (onPress?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      onPress?.();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[alertStyles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            alertStyles.container,
            { backgroundColor: colors.surface, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Icon */}
          <View style={[alertStyles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Text style={alertStyles.iconText}>!</Text>
          </View>

          {/* Content */}
          <Text style={[alertStyles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[alertStyles.message, { color: colors.textSecondary }]}>{message}</Text>

          {/* Buttons */}
          <View style={alertStyles.buttonContainer}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    alertStyles.button,
                    isDestructive && alertStyles.buttonDestructive,
                    isCancel && [alertStyles.buttonCancel, { borderColor: colors.border }],
                    !isDestructive && !isCancel && alertStyles.buttonPrimary,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => handleButtonPress(button.onPress)}
                >
                  <Text
                    style={[
                      alertStyles.buttonText,
                      isDestructive && alertStyles.buttonTextDestructive,
                      isCancel && [alertStyles.buttonTextCancel, { color: colors.textMuted }],
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3B82F6',
  },
  buttonDestructive: {
    backgroundColor: '#DC2626',
  },
  buttonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: '#6B7280',
  },
});

// ============================================
// MAIN COMPONENT
// ============================================

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
  const [inputFocused, setInputFocused] = useState(false);

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }>;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }> = [{ text: 'Tamam' }]
  ) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (!isNew && !existingTemplate) {
      showAlert('Hata', 'Şablon bulunamadı.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
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
      showAlert('Uyarı', 'Döngü en az 2 gün olmalıdır.');
      return;
    }
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    setSelectedStepIndex(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showAlert('Eksik Bilgi', 'Lütfen şablon için bir isim girin.');
      return;
    }

    if (steps.length < 2) {
      showAlert('Uyarı', 'Döngü en az 2 gün olmalıdır.');
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
      showAlert('Uyarı', 'Sistem şablonları silinemez.');
      return;
    }

    showAlert(
      'Şablonu Sil',
      `"${existingTemplate.name}" şablonunu silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== İSİM ALANI ========== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Şablon İsmi
          </Text>
          <View
            style={[
              styles.inputCard,
              { backgroundColor: colors.surface, borderColor: inputFocused ? colors.primary : colors.border },
              inputFocused && styles.inputCardFocused,
            ]}
          >
            <TextInput
              style={[styles.nameInput, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Sabah-Öğle Döngüsü"
              placeholderTextColor={colors.textMuted}
              editable={isEditable}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </View>
        </View>

        {/* ========== DÖNGÜ GRID ========== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Vardiya Döngüsü ({steps.length} gün)
          </Text>
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stepsGrid}>
              {steps.map((step, index) => {
                const isSelected = selectedStepIndex === index;
                const shiftColor = getShiftColor(step);
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.stepCard,
                      { backgroundColor: colors.surface, borderColor: shiftColor },
                      isSelected && [
                        styles.stepCardSelected,
                        {
                          borderColor: shiftColor,
                          shadowColor: shiftColor,
                          shadowOpacity: 0.4,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 6,
                        },
                      ],
                      pressed && { transform: [{ scale: 0.96 }] },
                    ]}
                    onPress={() => isEditable && setSelectedStepIndex(index)}
                    onLongPress={() => isEditable && removeStep(index)}
                  >
                    <Text style={[styles.stepIndex, { color: isSelected ? shiftColor : colors.textMuted }]}>
                      {index + 1}
                    </Text>
                    <View style={[styles.stepBadge, { backgroundColor: shiftColor }]}>
                      <Text style={styles.stepCode}>{getShiftShortName(step)}</Text>
                    </View>
                  </Pressable>
                );
              })}
              {isEditable && (
                <Pressable
                  style={({ pressed }) => [
                    styles.addStepCard,
                    { borderColor: colors.border },
                    pressed && { backgroundColor: colors.surfaceSecondary, transform: [{ scale: 0.95 }] },
                  ]}
                  onPress={addStep}
                >
                  <View style={[styles.addStepIcon, { backgroundColor: colors.primary }]}>
                    <Text style={styles.addStepPlus}>+</Text>
                  </View>
                  <Text style={[styles.addStepLabel, { color: colors.textMuted }]}>Gün Ekle</Text>
                </Pressable>
              )}
            </View>

            {isEditable && (
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Değiştirmek için dokun, silmek için uzun bas
              </Text>
            )}
          </View>
        </View>

        {/* ========== VARDİYA SEÇİCİ ========== */}
        {selectedStepIndex !== null && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              {selectedStepIndex + 1}. Gün İçin Vardiya Seç
            </Text>
            <View style={[styles.shiftSelectorBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {shiftTypes.map((shift) => (
                <Pressable
                  key={shift.id}
                  style={({ pressed }) => [
                    styles.shiftBarItem,
                    { borderColor: shift.color },
                    pressed && { transform: [{ scale: 0.95 }], opacity: 0.85 },
                  ]}
                  onPress={() => handleStepChange(shift.code)}
                >
                  <View style={[styles.shiftBarBadge, { backgroundColor: shift.color }]}>
                    <Text style={styles.shiftBarCode}>{shift.shortName}</Text>
                  </View>
                  <Text style={[styles.shiftBarName, { color: colors.text }]}>{shift.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ========== ÖNİZLEME ========== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Döngü Önizleme
          </Text>
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.previewGrid}>
              {steps.map((step, index) => (
                <View
                  key={index}
                  style={[styles.previewChip, { backgroundColor: getShiftColor(step) }]}
                >
                  <Text style={styles.previewChipText}>{getShiftShortName(step)}</Text>
                </View>
              ))}
              {/* Repeat indicator */}
              <View style={[styles.previewRepeatInline, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.previewRepeatIcon, { color: colors.textMuted }]}>↺</Text>
              </View>
            </View>
            <Text style={[styles.previewHint, { color: colors.textMuted }]}>
              Bu döngü sürekli tekrar eder
            </Text>
          </View>
        </View>

        {/* ========== SİL BUTONU ========== */}
        {!isNew && isEditable && (
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Şablonu Sil</Text>
          </Pressable>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ========== ALT AKSİYON ALANI ========== */}
      {isEditable && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>İptal</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>{isNew ? 'Oluştur' : 'Kaydet'}</Text>
          </Pressable>
        </View>
      )}

      {/* ========== ALERT MODAL ========== */}
      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },

  // Section Container
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Input Card
  inputCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputCardFocused: {
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },

  // Grid Card
  gridCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stepCard: {
    width: 64,
    height: 76,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  stepCardSelected: {
    borderWidth: 2.5,
    transform: [{ scale: 1.02 }],
  },
  stepIndex: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  stepBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addStepCard: {
    width: 64,
    height: 76,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addStepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStepPlus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addStepLabel: {
    fontSize: 9,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
  },

  // Shift Selector - Horizontal Bar
  shiftSelectorBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  shiftBarItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  shiftBarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftBarCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shiftBarName: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Preview - Wrap Grid
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  previewChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
  },
  previewChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewRepeatInline: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRepeatIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewHint: {
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },

  // Delete Button
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 24,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
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
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
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
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
