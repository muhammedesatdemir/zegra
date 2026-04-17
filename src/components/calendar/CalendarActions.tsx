/**
 * CalendarActions Component
 *
 * Bottom action area - integrated with calendar, not a separate block.
 * Single "Ay Olustur" button with subtle, modern design.
 */

import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context';
import { PressableScale } from '../ui';

interface CalendarActionsProps {
  onGenerate: () => void;
}

export function CalendarActions({ onGenerate }: CalendarActionsProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <PressableScale
        style={styles.button}
        onPress={onGenerate}
        borderRadius={14}
        pressedScale={0.98}
        rippleColor="rgba(255,255,255,0.22)"
      >
        {/* Plus Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.plusHorizontal} />
          <View style={styles.plusVertical} />
        </View>
        <Text style={styles.buttonText}>Ay Oluştur</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  iconContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 14,
    height: 2.5,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  plusVertical: {
    position: 'absolute',
    width: 2.5,
    height: 14,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
