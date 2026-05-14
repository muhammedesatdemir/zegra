/**
 * HomeBottomActions
 *
 * Ana sayfanın altındaki 2-buton yan yana yerleşim: "Mesai Özeti" ve
 * "Aylık Notlar". QuickActions kart stiliyle birebir uyumlu — aynı padding,
 * border radius, gölge, ikon kutusu, font ölçüleri.
 *
 * Önceden MesaiOzetiButton tam genişlikte tek butondu. Notlar özelliği
 * eklenince simetrik bir çift yapı daha doğal — bu component ikisini birden
 * yönetir, ana sayfada tek bir yere yerleşir.
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context';
import { PressableScale } from '../ui';

interface HomeBottomActionsProps {
  onPressSummary: () => void;
  onPressNotes: () => void;
}

export function HomeBottomActions({
  onPressSummary,
  onPressNotes,
}: HomeBottomActionsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <PressableScale
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={onPressSummary}
        borderRadius={16}
        pressedScale={0.97}
        rippleColor="rgba(59,130,246,0.10)"
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.icon}>⏱</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Mesai Özeti</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Fazla / eksik saat
          </Text>
        </View>
      </PressableScale>

      <PressableScale
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={onPressNotes}
        borderRadius={16}
        pressedScale={0.97}
        rippleColor="rgba(59,130,246,0.10)"
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.icon}>📝</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Aylık Notlar</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Bu ayın notları
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
});
