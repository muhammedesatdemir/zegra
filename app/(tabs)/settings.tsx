/**
 * Settings Screen (Ayarlar)
 *
 * Basic app preferences and data management.
 */

import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useScheduleStore } from '../../src/stores';
import { useTheme } from '../../src/context';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const settings = useScheduleStore((state) => state.settings);
  const templates = useScheduleStore((state) => state.templates);
  const updateSettings = useScheduleStore((state) => state.updateSettings);
  const exportData = useScheduleStore((state) => state.exportData);
  const clearAllData = useScheduleStore((state) => state.clearAllData);

  const activeTemplate = templates.find(
    (t) => t.id === settings.activeTemplateId
  );

  const handleExport = async () => {
    const data = exportData();
    Alert.alert(
      'Veri Dışa Aktarıldı',
      'Verileriniz JSON formatında hazır.',
      [{ text: 'Tamam' }]
    );
    console.log('Exported data:', data);
  };

  const handleClearData = () => {
    Alert.alert(
      'Tüm Verileri Sil',
      'Bu işlem geri alınamaz. Tüm vardiya planlarınız, şablonlarınız ve ayarlarınız silinecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Başarılı', 'Tüm veriler silindi.');
          },
        },
      ]
    );
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    section: { backgroundColor: colors.surface, borderColor: colors.border },
    row: { borderBottomColor: colors.borderLight },
    rowLabel: { color: colors.text },
    rowValueText: { color: colors.textMuted },
    sectionTitle: { color: colors.textMuted },
    segmentedControl: { backgroundColor: colors.surfaceSecondary },
    segment: { backgroundColor: 'transparent' },
    segmentActive: { backgroundColor: colors.surface },
    segmentText: { color: colors.textMuted },
    segmentTextActive: { color: colors.text },
    footerText: { color: colors.text },
    footerSubtext: { color: colors.textMuted },
  };

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      {/* Appearance Section */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Görünüm</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <View style={[styles.row, dynamicStyles.row]}>
          <Text style={[styles.rowLabel, dynamicStyles.rowLabel]}>Tema</Text>
          <View style={[styles.segmentedControl, dynamicStyles.segmentedControl]}>
            {(['light', 'dark'] as const).map((theme) => (
              <Pressable
                key={theme}
                style={[
                  styles.segment,
                  settings.theme === theme && [styles.segmentActive, dynamicStyles.segmentActive],
                ]}
                onPress={() => updateSettings({ theme })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    dynamicStyles.segmentText,
                    settings.theme === theme && [styles.segmentTextActive, dynamicStyles.segmentTextActive],
                  ]}
                >
                  {theme === 'light' ? 'Açık' : 'Koyu'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.row, dynamicStyles.row]}>
          <Text style={[styles.rowLabel, dynamicStyles.rowLabel]}>Hafta Başlangıcı</Text>
          <View style={[styles.segmentedControl, dynamicStyles.segmentedControl]}>
            <Pressable
              style={[
                styles.segment,
                settings.weekStartsOnMonday && [styles.segmentActive, dynamicStyles.segmentActive],
              ]}
              onPress={() => updateSettings({ weekStartsOnMonday: true })}
            >
              <Text
                style={[
                  styles.segmentText,
                  dynamicStyles.segmentText,
                  settings.weekStartsOnMonday && [styles.segmentTextActive, dynamicStyles.segmentTextActive],
                ]}
              >
                Pazartesi
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segment,
                !settings.weekStartsOnMonday && [styles.segmentActive, dynamicStyles.segmentActive],
              ]}
              onPress={() => updateSettings({ weekStartsOnMonday: false })}
            >
              <Text
                style={[
                  styles.segmentText,
                  dynamicStyles.segmentText,
                  !settings.weekStartsOnMonday && [styles.segmentTextActive, dynamicStyles.segmentTextActive],
                ]}
              >
                Pazar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Program Section */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Program</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <Pressable
          style={[styles.row, dynamicStyles.row]}
          onPress={() => router.push('/templates')}
        >
          <Text style={[styles.rowLabel, dynamicStyles.rowLabel]}>Aktif Şablon</Text>
          <View style={styles.rowValue}>
            <Text style={[styles.rowValueText, dynamicStyles.rowValueText]}>
              {activeTemplate?.name ?? 'Seçilmedi'}
            </Text>
            <Text style={[styles.rowArrow, { color: colors.textMuted }]}>›</Text>
          </View>
        </Pressable>
      </View>

      {/* Data Section */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Veri</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <Pressable style={[styles.row, dynamicStyles.row]} onPress={handleExport}>
          <Text style={[styles.rowLabel, dynamicStyles.rowLabel]}>Verileri Dışa Aktar</Text>
          <Text style={[styles.rowArrow, { color: colors.textMuted }]}>›</Text>
        </Pressable>

        <Pressable style={styles.rowDanger} onPress={handleClearData}>
          <Text style={styles.rowLabelDanger}>Tüm Verileri Sil</Text>
        </Pressable>
      </View>

      {/* About Section */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Hakkında</Text>
      <View style={[styles.section, dynamicStyles.section]}>
        <View style={[styles.row, dynamicStyles.row]}>
          <Text style={[styles.rowLabel, dynamicStyles.rowLabel]}>Versiyon</Text>
          <Text style={[styles.rowValueText, dynamicStyles.rowValueText]}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, dynamicStyles.footerText]}>Vardiya Planı</Text>
        <Text style={[styles.footerSubtext, dynamicStyles.footerSubtext]}>
          Vardiyalı çalışanlar için pratik planlama uygulaması
        </Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowLabelDanger: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValueText: {
    fontSize: 16,
  },
  rowArrow: {
    fontSize: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentText: {
    fontSize: 13,
  },
  segmentTextActive: {
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});
