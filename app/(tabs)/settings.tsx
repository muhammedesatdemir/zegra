/**
 * Settings Screen (Ayarlar)
 *
 * Modern, premium settings interface with proper Turkish character support,
 * Excel export functionality, and clean UX.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore } from '../../src/stores';
import { useTheme } from '../../src/context';
import { PressableScale } from '../../src/components/ui';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type ModalType = 'export' | 'delete' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const settings = useScheduleStore((state) => state.settings);
  const templates = useScheduleStore((state) => state.templates);
  const plannedDays = useScheduleStore((state) => state.plannedDays);
  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const updateSettings = useScheduleStore((state) => state.updateSettings);
  const clearAllData = useScheduleStore((state) => state.clearAllData);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFilePath, setExportFilePath] = useState<string | null>(null);

  const activeTemplate = templates.find(
    (t) => t.id === settings.activeTemplateId
  );

  // Generate CSV content for Excel
  const generateExcelContent = (): string => {
    // BOM for UTF-8 Excel compatibility
    const BOM = '\uFEFF';

    // Header
    let csv = BOM + 'Tarih,Gün,Vardiya,Saat Başlangıç,Saat Bitiş,Not,Korumalı\n';

    // Sort dates
    const sortedDates = Object.keys(plannedDays).sort();

    // Get day names in Turkish
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    for (const dateStr of sortedDates) {
      const day = plannedDays[dateStr];
      if (!day) continue;
      const shift = shiftTypes.find(st => st.code === day.shiftCode);
      // Parse as local date — new Date('YYYY-MM-DD') treats the string as UTC
      // which can shift the weekday by one in non-UTC timezones.
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
      const dayName = dayNames[date.getDay()] ?? '';

      const row = [
        dateStr,
        dayName,
        shift?.name || day.shiftCode,
        shift?.startTime || '',
        shift?.endTime || '',
        day.note ? `"${day.note.replace(/"/g, '""')}"` : '',
        day.isLocked ? 'Evet' : 'Hayır',
      ];

      csv += row.join(',') + '\n';
    }

    return csv;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const csvContent = generateExcelContent();
      // Use local Y-M-D, not toISOString, to keep the filename date in the
      // user's timezone (matches the day the user tapped "export").
      const now = new Date();
      const fileDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `zekra-vardiya-${fileDate}.csv`;
      const file = new ExpoFile(Paths.cache, fileName);
      file.write(csvContent);
      const filePath = file.uri;

      setExportFilePath(filePath);
      setActiveModal('export');
    } catch (error) {
      if (__DEV__) {
        console.error('Export failed:', error);
      }
      Alert.alert('Hata', 'Dosya oluşturulurken bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareExport = async () => {
    if (!exportFilePath) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(exportFilePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Vardiya Planını Paylaş',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Share failed:', error);
      }
    }
    setActiveModal(null);
  };

  const handleSaveExport = async () => {
    if (!exportFilePath) return;

    try {
      // On mobile, sharing is the primary way to "save"
      // User can choose to save to Files app from share sheet
      await handleShareExport();
    } catch (error) {
      if (__DEV__) {
        console.error('Save failed:', error);
      }
    }
  };

  const handleClearData = () => {
    setActiveModal('delete');
  };

  const confirmDelete = () => {
    clearAllData();
    setActiveModal(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Görünüm Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            GÖRÜNÜM
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Theme Selector */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
                  <View style={styles.sunIcon}>
                    <View style={[styles.sunCenter, { backgroundColor: '#3B82F6' }]} />
                  </View>
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Tema</Text>
              </View>
              <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceSecondary }]}>
                <PressableScale
                  style={[
                    styles.segment,
                    settings.theme === 'light' && [
                      styles.segmentActive,
                      { backgroundColor: colors.surface },
                    ],
                  ]}
                  onPress={() => updateSettings({ theme: 'light' })}
                  borderRadius={8}
                  pressedScale={0.96}
                  rippleColor="rgba(59,130,246,0.10)"
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: settings.theme === 'light' ? colors.text : colors.textMuted },
                      settings.theme === 'light' && styles.segmentTextActive,
                    ]}
                  >
                    Açık
                  </Text>
                </PressableScale>
                <PressableScale
                  style={[
                    styles.segment,
                    settings.theme === 'dark' && [
                      styles.segmentActive,
                      { backgroundColor: colors.surface },
                    ],
                  ]}
                  onPress={() => updateSettings({ theme: 'dark' })}
                  borderRadius={8}
                  pressedScale={0.96}
                  rippleColor="rgba(59,130,246,0.10)"
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: settings.theme === 'dark' ? colors.text : colors.textMuted },
                      settings.theme === 'dark' && styles.segmentTextActive,
                    ]}
                  >
                    Koyu
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        </View>

        {/* Program Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PROGRAM
          </Text>
          <View style={[styles.card, styles.cardClip, { backgroundColor: colors.surface }]}>
            <PressableScale
              style={[styles.row, styles.navigationRow]}
              onPress={() => router.push('/templates')}
              borderRadius={16}
              pressedScale={0.99}
              rippleColor="rgba(139, 92, 246, 0.10)"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#8B5CF620' }]}>
                  <View style={styles.templateIcon}>
                    <View style={[styles.templateLine, { backgroundColor: '#8B5CF6' }]} />
                    <View style={[styles.templateLine, styles.templateLineShort, { backgroundColor: '#8B5CF6' }]} />
                    <View style={[styles.templateLine, { backgroundColor: '#8B5CF6' }]} />
                  </View>
                </View>
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Aktif Şablon</Text>
                  <Text style={[styles.rowSubtext, { color: colors.textMuted }]}>
                    {activeTemplate?.name ?? 'Seçilmedi'}
                  </Text>
                </View>
              </View>
              <View style={[styles.arrowContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
              </View>
            </PressableScale>
          </View>
        </View>

        {/* Veri Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            VERİ
          </Text>
          <View style={[styles.card, styles.cardClip, { backgroundColor: colors.surface }]}>
            <PressableScale
              style={[styles.row, styles.navigationRow]}
              onPress={handleExport}
              disabled={isExporting}
              pressedScale={0.995}
              pressedOpacity={0.85}
              rippleColor="rgba(16, 185, 129, 0.10)"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                  <View style={styles.exportIcon}>
                    <View style={[styles.exportArrow, { borderColor: '#10B981' }]} />
                    <View style={[styles.exportBase, { backgroundColor: '#10B981' }]} />
                  </View>
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {isExporting ? 'Hazırlanıyor...' : 'Verileri Dışa Aktar'}
                </Text>
              </View>
              <View style={[styles.arrowContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
              </View>
            </PressableScale>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <PressableScale
              style={[styles.row, styles.dangerRow]}
              onPress={handleClearData}
              pressedScale={0.995}
              pressedOpacity={0.85}
              rippleColor="rgba(239, 68, 68, 0.10)"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
                  <View style={styles.trashIcon}>
                    <View style={[styles.trashTop, { backgroundColor: '#EF4444' }]} />
                    <View style={[styles.trashBody, { borderColor: '#EF4444' }]} />
                  </View>
                </View>
                <Text style={[styles.rowLabel, styles.dangerText]}>Tüm Verileri Sil</Text>
              </View>
            </PressableScale>
          </View>
        </View>

        {/* Hakkında Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            HAKKINDA
          </Text>
          <View style={[styles.card, styles.aboutCard, { backgroundColor: colors.surface }]}>
            <View style={styles.aboutHeader}>
              <Text style={[styles.aboutBrand, { color: colors.text }]}>Zekra</Text>
              <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>
                Sürüm 1.0.0
              </Text>
            </View>

            <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />

            <Text style={[styles.aboutLine, { color: colors.textSecondary }]}>
              <Text style={styles.aboutLineLabel}>Geliştiren: </Text>
              Muhammed Esat Demir
            </Text>
            <Text style={[styles.aboutLine, { color: colors.textSecondary }]}>
              <Text style={styles.aboutLineLabel}>Fikir katkısı: </Text>
              Muhammet Mustafa Demir
            </Text>
          </View>
        </View>

        {/* Footer — hafif imza */}
        <View style={styles.footer}>
          <Text style={[styles.footerSignature, { color: colors.textMuted }]}>
            Vardiyalı çalışanlar için pratik planlama
          </Text>
        </View>
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={activeModal === 'export'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#10B98120' }]}>
              <View style={styles.checkIcon}>
                <View style={[styles.checkShort, { backgroundColor: '#10B981' }]} />
                <View style={[styles.checkLong, { backgroundColor: '#10B981' }]} />
              </View>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Dışa Aktarma Hazır
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Vardiya planınız Excel uyumlu dosya olarak hazırlandı. Dosyayı paylaşabilir veya cihazınıza kaydedebilirsiniz.
            </Text>
            <View style={styles.modalActions}>
              <PressableScale
                style={[
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => setActiveModal(null)}
                borderRadius={12}
                pressedScale={0.98}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Kapat
                </Text>
              </PressableScale>
              <PressableScale
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleShareExport}
                borderRadius={12}
                pressedScale={0.98}
                rippleColor="rgba(255,255,255,0.22)"
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Paylaş
                </Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={activeModal === 'delete'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#EF444420' }]}>
              <View style={styles.warningIcon}>
                <View style={[styles.warningLine, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.warningDot, { backgroundColor: '#EF4444' }]} />
              </View>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Tüm veriler silinsin mi?
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Bu işlem geri alınamaz. Tüm vardiya planlarınız, notlarınız ve ayarlarınız kalıcı olarak silinecektir.
            </Text>
            <View style={styles.modalActions}>
              <PressableScale
                style={[
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => setActiveModal(null)}
                borderRadius={12}
                pressedScale={0.98}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Vazgeç
                </Text>
              </PressableScale>
              <PressableScale
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={confirmDelete}
                borderRadius={12}
                pressedScale={0.98}
                rippleColor="rgba(255,255,255,0.22)"
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Sil
                </Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Card
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Clip inner pressables (for Android ripple bounds) without killing shadows on iOS
  cardClip: {
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  navigationRow: {
    borderRadius: 16,
  },
  dangerRow: {
    borderRadius: 16,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  dangerText: {
    color: '#EF4444',
  },

  // Divider
  divider: {
    height: 1,
    marginHorizontal: 16,
    opacity: 0.5,
  },

  // Icon Container
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sun Icon
  sunIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Template Icon
  templateIcon: {
    width: 14,
    gap: 3,
  },
  templateLine: {
    height: 2,
    borderRadius: 1,
  },
  templateLineShort: {
    width: '70%',
  },

  // Export Icon
  exportIcon: {
    width: 14,
    height: 14,
    alignItems: 'center',
  },
  exportArrow: {
    width: 8,
    height: 8,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    transform: [{ rotate: '45deg' }, { translateY: 2 }],
  },
  exportBase: {
    width: 2,
    height: 8,
    position: 'absolute',
    bottom: 0,
  },

  // Trash Icon
  trashIcon: {
    width: 12,
    height: 14,
    alignItems: 'center',
  },
  trashTop: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  trashBody: {
    width: 10,
    height: 10,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  // Arrow
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentPressed: {
    opacity: 0.7,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  segmentTextActive: {
    fontWeight: '600',
  },

  // Hakkında (About) card
  aboutCard: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  aboutBrand: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  aboutVersion: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.85,
  },
  aboutDivider: {
    height: 1,
    marginTop: 12,
    marginBottom: 14,
    opacity: 0.5,
  },
  aboutLine: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.85,
  },
  aboutLineLabel: {
    opacity: 0.7,
  },

  // Footer (imza)
  footer: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  footerSignature: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
    opacity: 0.75,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    // backgroundColor set dynamically
  },
  modalButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  modalButtonDanger: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#fff',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Check Icon
  checkIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkShort: {
    position: 'absolute',
    width: 3,
    height: 10,
    borderRadius: 1.5,
    transform: [{ rotate: '-45deg' }, { translateX: -4 }, { translateY: 2 }],
  },
  checkLong: {
    position: 'absolute',
    width: 3,
    height: 16,
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }, { translateX: 4 }, { translateY: -1 }],
  },

  // Warning Icon
  warningIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
  },
  warningLine: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
  },
  warningDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
  },
});
