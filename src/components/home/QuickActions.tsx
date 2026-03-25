/**
 * QuickActions
 *
 * Two main action buttons.
 * Clean, premium, Turkish character support.
 * No "Revize Et" - simplified to essential actions only.
 */

import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../../context';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Hızlı İşlemler
      </Text>
      <View style={styles.row}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.surface },
              pressed && styles.buttonPressed,
            ]}
            onPress={action.onPress}
          >
            <Text style={styles.icon}>{action.icon}</Text>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                {action.label}
              </Text>
              {action.subtitle && (
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {action.subtitle}
                </Text>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
    }),
  },
});
