/**
 * Settings Screen (Ayarlar)
 *
 * Modern, premium settings interface with card-based sections,
 * custom modals, and smooth micro-interactions.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore } from '../../src/stores';
import { useTheme } from '../../src/context';

type ModalType = 'export' | 'delete' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const settings = useScheduleStore((state) => state.settings);
  const templates = useScheduleStore((state) => state.templates);
  const updateSettings = useScheduleStore((state) => state.updateSettings);
  const exportData = useScheduleStore((state) => state.exportData);
  const clearAllData = useScheduleStore((state) => state.clearAllData);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [exportedData, setExportedData] = useState<string>('');

  const activeTemplate = templates.find(
    (t) => t.id === settings.activeTemplateId
  );

  const handleExport = () => {
    const data = exportData();
    setExportedData(data);
    setActiveModal('export');
  };

  const handleShareExport = async () => {
    try {
      await Share.share({
        message: exportedData,
        title: 'Zegra Veri Yedegi',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
    setActiveModal(null);
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
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Gorunum
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Theme Selector */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
                  <View style={styles.sunIcon}>
                    <View style={[styles.sunCenter, { backgroundColor: '#3B82F6' }]} />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                      <View
                        key={angle}
                        style={[
                          styles.sunRay,
                          { backgroundColor: '#3B82F6', transform: [{ rotate: `${angle}deg` }] },
                        ]}
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Tema</Text>
              </View>
              <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceSecondary }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.segment,
                    settings.theme === 'light' && [
                      styles.segmentActive,
                      { backgroundColor: colors.surface },
                    ],
                    pressed && styles.segmentPressed,
                  ]}
                  onPress={() => updateSettings({ theme: 'light' })}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: settings.theme === 'light' ? colors.text : colors.textMuted },
                      settings.theme === 'light' && styles.segmentTextActive,
                    ]}
                  >
                    Acik
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.segment,
                    settings.theme === 'dark' && [
                      styles.segmentActive,
                      { backgroundColor: colors.surface },
                    ],
                    pressed && styles.segmentPressed,
                  ]}
                  onPress={() => updateSettings({ theme: 'dark' })}
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
                </Pressable>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Week Start Selector */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                  <View style={styles.calendarIcon}>
                    <View style={[styles.calendarTop, { backgroundColor: '#10B981' }]} />
                    <View style={[styles.calendarBody, { borderColor: '#10B981' }]}>
                      <View style={[styles.calendarDot, { backgroundColor: '#10B981' }]} />
                    </View>
                  </View>
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Hafta Baslangici</Text>
              </View>
              <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceSecondary }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.segment,
                    settings.weekStartsOnMonday && [
                      styles.segmentActive,
                      { backgroundColor: colors.surface },
                    ],
                    pressed && styles.segmentPressed,
                  ]}
                  onPress={() => updateSettings({ weekStartsOnMonday: true })}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: settings.weekStartsOnMonday ? colors.text : colors.textMuted },
                      settings.weekStartsOnMonday && styles.segmentTextActive,
                    ]}
                  >
                    Pzt
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.segment,
                    !settings.weekStartsOnMonday && [
                      styles.segmentActive,
                      { backgroundColor: colors.surface },
                    ],
                    pressed && styles.segmentPressed,
                  ]}
                  onPress={() => updateSettings({ weekStartsOnMonday: false })}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: !settings.weekStartsOnMonday ? colors.text : colors.textMuted },
                      !settings.weekStartsOnMonday && styles.segmentTextActive,
                    ]}
                  >
                    Paz
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Program Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Program
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.navigationCard,
              { backgroundColor: colors.surface },
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push('/templates')}
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
                <Text style={[styles.rowLabel, { color: colors.text }]}>Aktif Sablon</Text>
                <Text style={[styles.rowSubtext, { color: colors.textMuted }]}>
                  {activeTemplate?.name ?? 'Secilmedi'}
                </Text>
              </View>
            </View>
            <View style={[styles.arrowContainer, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Veri
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                styles.navigationRow,
                pressed && styles.rowPressed,
              ]}
              onPress={handleExport}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#F5920B20' }]}>
                  <View style={styles.exportIcon}>
                    <View style={[styles.exportArrow, { borderColor: '#F59E0B' }]} />
                    <View style={[styles.exportBase, { backgroundColor: '#F59E0B' }]} />
                  </View>
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Verileri Disa Aktar</Text>
              </View>
              <View style={[styles.arrowContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [
                styles.row,
                styles.dangerRow,
                pressed && styles.rowPressed,
              ]}
              onPress={handleClearData}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
                  <View style={styles.trashIcon}>
                    <View style={[styles.trashTop, { backgroundColor: '#EF4444' }]} />
                    <View style={[styles.trashBody, { borderColor: '#EF4444' }]} />
                  </View>
                </View>
                <Text style={[styles.rowLabel, styles.dangerText]}>Tum Verileri Sil</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Hakkinda
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#6B728020' }]}>
                  <Text style={styles.versionIcon}>v</Text>
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Versiyon</Text>
              </View>
              <Text style={[styles.versionText, { color: colors.textMuted }]}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: colors.text }]}>Zegra</Text>
          <Text style={[styles.footerSubtitle, { color: colors.textMuted }]}>
            Vardiyali calisanlar icin pratik planlama
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
              Veriler Hazir
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Verileriniz JSON formatinda disa aktarilmaya hazir.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  { backgroundColor: colors.surfaceSecondary },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Kapat
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleShareExport}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Paylas
                </Text>
              </Pressable>
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
              Emin misiniz?
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Tum vardiya planlari, sablonlar ve ayarlar silinecek. Bu islem geri alinamaz.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  { backgroundColor: colors.surfaceSecondary },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Iptal
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonDanger,
                  pressed && styles.buttonPressed,
                ]}
                onPress={confirmDelete}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Sil
                </Text>
              </Pressable>
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
    paddingTop: 8,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
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
  navigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sunRay: {
    position: 'absolute',
    width: 2,
    height: 4,
    borderRadius: 1,
    top: 0,
  },

  // Calendar Icon
  calendarIcon: {
    width: 16,
    height: 14,
  },
  calendarTop: {
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  calendarBody: {
    flex: 1,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
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

  // Version Icon
  versionIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
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
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextActive: {
    fontWeight: '600',
  },

  // Version
  versionText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 13,
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
