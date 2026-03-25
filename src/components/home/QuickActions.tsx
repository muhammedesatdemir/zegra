/**
 * QuickActions
 *
 * Two main action buttons.
 * Taller cards, bigger icons, stronger block feel.
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
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.icon}>{action.icon}</Text>
            </View>
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
    marginTop: 4,
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
    padding: 14,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
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
