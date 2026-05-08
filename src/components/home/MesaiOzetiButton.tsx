/**
 * MesaiOzetiButton
 *
 * Hızlı İşlemler bölümünün altında yer alan tam genişlikte buton.
 * QuickActions kart stilini birebir takip eder; ana ekranda 2+1 düzenini
 * tamamlar (üstte Takvim + Plan, altta Mesai Özeti).
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context';
import { PressableScale } from '../ui';

interface MesaiOzetiButtonProps {
  onPress: () => void;
}

export function MesaiOzetiButton({ onPress }: MesaiOzetiButtonProps) {
  const { colors } = useTheme();

  return (
    <PressableScale
      style={[styles.button, { backgroundColor: colors.surface }]}
      onPress={onPress}
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
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 12,
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
