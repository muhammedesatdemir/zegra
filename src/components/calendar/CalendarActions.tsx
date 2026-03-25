/**
 * CalendarActions Component
 *
 * Bottom action area with single "Ay Olustur" button.
 * Minimal, clean design that doesn't dominate the screen.
 */

import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../../context';

interface CalendarActionsProps {
  onGenerate: () => void;
}

export function CalendarActions({ onGenerate }: CalendarActionsProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={onGenerate}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.calendarIcon}>
            <View style={styles.calendarTop} />
            <View style={styles.calendarBody}>
              <View style={styles.calendarDot} />
              <View style={styles.calendarDot} />
              <View style={styles.calendarDot} />
              <View style={styles.calendarDot} />
            </View>
          </View>
        </View>
        <Text style={styles.buttonText}>Ay Olustur</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    width: 16,
    height: 14,
  },
  calendarTop: {
    height: 3,
    backgroundColor: '#fff',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: 1,
  },
  calendarBody: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
    gap: 1,
  },
  calendarDot: {
    width: 3,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
});
