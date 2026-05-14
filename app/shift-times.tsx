/**
 * Shift Times Screen (Vardiya Saatleri)
 *
 * Lets the user customize the default start/end time of working shift types
 * (Sabah, Öğle, Gece). The selection persists to ShiftType in the store and
 * thereby affects every screen that reads shiftType.startTime/endTime —
 * past, present and future planned days alike.
 *
 * Out of scope (per product decision):
 *   - editing OFF / OFF1 / OFF2 (off variants are filtered out)
 *   - editing code, color, name
 *   - per-day custom times (those still take precedence via getEffectiveShiftTime)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore } from '../src/stores';
import { useTheme } from '../src/context';
import { PressableScale } from '../src/components/ui';
import { DEFAULT_SHIFT_TYPES } from '../src/constants/shifts';
import { formatHM, isOvernightFromHM, parseHM } from '../src/utils/shiftTime';
import type { ShiftType } from '../src/types';

const OFF_CODES = new Set(['OFF', 'OFF1', 'OFF2']);

export default function ShiftTimesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const shiftTypes = useScheduleStore((state) => state.shiftTypes);
  const saveShiftType = useScheduleStore((state) => state.saveShiftType);

  // Only working, non-OFF shifts get edited here.
  const editableShifts = useMemo(
    () =>
      shiftTypes.filter(
        (st) => st.isWorking && !OFF_CODES.has(st.code) && st.isEditable
      ),
    [shiftTypes]
  );

  const [editing, setEditing] = useState<ShiftType | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Vardiya Saatleri
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Sabah, öğle ve gece vardiyalarının saatlerini kendine göre düzenle.
            Bu saatler tüm planlarda otomatik kullanılır.
          </Text>
        </View>

        {/* Cards */}
        <View style={styles.cardList}>
          {editableShifts.map((shift) => (
            <ShiftTimeCard
              key={shift.id}
              shift={shift}
              colors={colors}
              isDark={isDark}
              onPress={() => setEditing(shift)}
            />
          ))}
        </View>

        {/* Footer hint */}
        <View style={styles.footerHint}>
          <View
            style={[
              styles.infoDot,
              { backgroundColor: colors.primary },
            ]}
          />
          <Text
            style={[styles.footerHintText, { color: colors.textMuted }]}
          >
            Bir güne özel saat girilmişse, o gün için özel saat öncelikli
            kullanılır.
          </Text>
        </View>
      </ScrollView>

      <ShiftTimeEditor
        shift={editing}
        onClose={() => setEditing(null)}
        onSave={(updated) => {
          saveShiftType(updated);
          setEditing(null);
        }}
      />
    </View>
  );
}

// ============================================
// CARD
// ============================================

interface ShiftTimeCardProps {
  shift: ShiftType;
  colors: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
  onPress: () => void;
}

function ShiftTimeCard({ shift, colors, isDark, onPress }: ShiftTimeCardProps) {
  const tintBg = isDark ? `${shift.color}26` : `${shift.color}1A`;
  const isOvernight = shift.isOvernight;

  return (
    <PressableScale
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={onPress}
      borderRadius={20}
      pressedScale={0.985}
      rippleColor={`${shift.color}26`}
    >
      {/* Left badge */}
      <View style={[styles.cardBadge, { backgroundColor: tintBg }]}>
        <View
          style={[styles.cardBadgeInner, { backgroundColor: shift.color }]}
        >
          <Text style={styles.cardBadgeText}>{shift.shortName}</Text>
        </View>
      </View>

      {/* Middle content */}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {shift.name}
          </Text>
          {isOvernight && (
            <View
              style={[
                styles.overnightChip,
                { backgroundColor: tintBg, borderColor: shift.color },
              ]}
            >
              <Text style={[styles.overnightChipText, { color: shift.color }]}>
                Gece geçer
              </Text>
            </View>
          )}
        </View>

        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {shift.startTime ?? '--:--'}
          </Text>
          <View style={[styles.timeDash, { backgroundColor: colors.border }]} />
          <Text style={[styles.timeText, { color: colors.text }]}>
            {shift.endTime ?? '--:--'}
          </Text>
        </View>

        <Text style={[styles.cardCaption, { color: colors.textMuted }]}>
          {shift.name} vardiyası için varsayılan saat aralığı
        </Text>
      </View>

      {/* Right chevron */}
      <View
        style={[
          styles.cardChevron,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <Text style={[styles.cardChevronText, { color: colors.textMuted }]}>
          ›
        </Text>
      </View>
    </PressableScale>
  );
}

// ============================================
// EDITOR (Bottom Sheet Modal)
// ============================================

interface ShiftTimeEditorProps {
  shift: ShiftType | null;
  onClose: () => void;
  onSave: (updated: ShiftType) => void;
}

function ShiftTimeEditor({ shift, onClose, onSave }: ShiftTimeEditorProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const visible = shift !== null;

  const [startH, setStartH] = useState('');
  const [startM, setStartM] = useState('');
  const [endH, setEndH] = useState('');
  const [endM, setEndM] = useState('');
  const [error, setError] = useState<string | null>(null);

  // The iOS KeyboardAvoidingView in this modal historically did not lift
  // the bottom sheet far enough on Android (where the modal sits over the
  // host activity and adjustResize doesn't reach it). Track the keyboard
  // height directly and push the sheet up by that amount — works the same
  // on both platforms inside a Modal.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslate = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  // Hydrate fields when a shift is selected.
  useEffect(() => {
    if (!shift) return;
    const start = parseHM(shift.startTime ?? '');
    const end = parseHM(shift.endTime ?? '');
    setStartH(start ? String(start.hours).padStart(2, '0') : '');
    setStartM(start ? String(start.minutes).padStart(2, '0') : '');
    setEndH(end ? String(end.hours).padStart(2, '0') : '');
    setEndM(end ? String(end.minutes).padStart(2, '0') : '');
    setError(null);
  }, [shift]);

  // Mount/dismiss animation.
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslate, {
          toValue: 0,
          useNativeDriver: true,
          tension: 90,
          friction: 11,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      sheetTranslate.setValue(40);
      sheetOpacity.setValue(0);
    }
  }, [visible]);

  if (!shift) {
    // Modal still rendered (visible=false) so animations work; bail content.
    return (
      <Modal visible={false} transparent animationType="none">
        <View />
      </Modal>
    );
  }

  const tintBg = isDark ? `${shift.color}26` : `${shift.color}1A`;

  const buildHM = (h: string, m: string): string | null => {
    const parsed = parseHM(`${h || '0'}:${m || '0'}`);
    if (!parsed) return null;
    return formatHM(parsed.hours, parsed.minutes);
  };

  const handleSave = () => {
    const startStr = buildHM(startH, startM);
    const endStr = buildHM(endH, endM);

    if (!startStr || !endStr) {
      setError('Saatleri 00–23, dakikaları 00–59 aralığında girin.');
      return;
    }
    if (startStr === endStr) {
      setError('Başlangıç ve bitiş aynı olamaz.');
      return;
    }

    const overnight = isOvernightFromHM(startStr, endStr);
    const updated: ShiftType = {
      ...shift,
      startTime: startStr,
      endTime: endStr,
      isOvernight: overnight,
    };
    onSave(updated);
  };

  const handleResetDefaults = () => {
    const defaults = DEFAULT_SHIFT_TYPES.find((d) => d.code === shift.code);
    if (!defaults || !defaults.startTime || !defaults.endTime) return;
    const start = parseHM(defaults.startTime);
    const end = parseHM(defaults.endTime);
    if (!start || !end) return;
    setStartH(String(start.hours).padStart(2, '0'));
    setStartM(String(start.minutes).padStart(2, '0'));
    setEndH(String(end.hours).padStart(2, '0'));
    setEndM(String(end.minutes).padStart(2, '0'));
    setError(null);
  };

  // When the keyboard is up, ignore the safe-area bottom inset (it's already
  // hidden behind the keyboard) and pad the sheet by the keyboard height so
  // the inputs and action buttons stay visible above it.
  const sheetBottomPadding =
    keyboardHeight > 0
      ? keyboardHeight + 16
      : Math.max(insets.bottom, 20) + 16;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={editorStyles.flex}>
        <Animated.View
          style={[editorStyles.overlay, { opacity: overlayOpacity }]}
        >
          <Pressable style={editorStyles.overlayTouch} onPress={onClose} />
        </Animated.View>

        <Animated.View
          pointerEvents="box-none"
          style={editorStyles.sheetWrapper}
        >
          <Animated.View
            style={[
              editorStyles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: sheetBottomPadding,
                opacity: sheetOpacity,
                transform: [{ translateY: sheetTranslate }],
              },
            ]}
          >
            {/* Drag handle */}
            <View
              style={[
                editorStyles.handle,
                { backgroundColor: colors.border },
              ]}
            />

            {/* Header */}
            <View style={editorStyles.header}>
              <View
                style={[
                  editorStyles.headerBadge,
                  { backgroundColor: tintBg },
                ]}
              >
                <View
                  style={[
                    editorStyles.headerBadgeInner,
                    { backgroundColor: shift.color },
                  ]}
                >
                  <Text style={editorStyles.headerBadgeText}>
                    {shift.shortName}
                  </Text>
                </View>
              </View>
              <View style={editorStyles.headerText}>
                <Text
                  style={[editorStyles.headerTitle, { color: colors.text }]}
                >
                  {shift.name}
                </Text>
                <Text
                  style={[
                    editorStyles.headerSubtitle,
                    { color: colors.textMuted },
                  ]}
                >
                  Başlangıç ve bitiş saatini düzenle
                </Text>
              </View>
            </View>

            {/* Time inputs */}
            <View style={editorStyles.inputsRow}>
              <TimeField
                label="Başlangıç"
                accentColor={shift.color}
                hours={startH}
                minutes={startM}
                onHoursChange={(v) => {
                  setStartH(v);
                  setError(null);
                }}
                onMinutesChange={(v) => {
                  setStartM(v);
                  setError(null);
                }}
                colors={colors}
              />

              <View style={editorStyles.separator}>
                <View
                  style={[
                    editorStyles.separatorDot,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View
                  style={[
                    editorStyles.separatorDot,
                    { backgroundColor: colors.border },
                  ]}
                />
              </View>

              <TimeField
                label="Bitiş"
                accentColor={shift.color}
                hours={endH}
                minutes={endM}
                onHoursChange={(v) => {
                  setEndH(v);
                  setError(null);
                }}
                onMinutesChange={(v) => {
                  setEndM(v);
                  setError(null);
                }}
                colors={colors}
              />
            </View>

            {/* Error */}
            {error && (
              <View
                style={[
                  editorStyles.errorBox,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <Text
                  style={[
                    editorStyles.errorText,
                    { color: colors.danger },
                  ]}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Reset (secondary) */}
            <PressableScale
              style={editorStyles.resetButton}
              onPress={handleResetDefaults}
              borderRadius={10}
              pressedScale={0.97}
              rippleColor={`${colors.primary}1F`}
            >
              <Text
                style={[editorStyles.resetText, { color: colors.primary }]}
              >
                ↺  Varsayılana dön
              </Text>
            </PressableScale>

            {/* Actions */}
            <View style={editorStyles.actions}>
              <PressableScale
                style={[
                  editorStyles.cancelButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={onClose}
                borderRadius={14}
                pressedScale={0.98}
              >
                <Text
                  style={[
                    editorStyles.cancelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  İptal
                </Text>
              </PressableScale>
              <PressableScale
                style={[
                  editorStyles.saveButton,
                  { backgroundColor: shift.color, shadowColor: shift.color },
                ]}
                onPress={handleSave}
                borderRadius={14}
                pressedScale={0.98}
                rippleColor="rgba(255,255,255,0.22)"
              >
                <Text style={editorStyles.saveText}>Kaydet</Text>
              </PressableScale>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// TIME FIELD (HH + MM)
// ============================================

interface TimeFieldProps {
  label: string;
  accentColor: string;
  hours: string;
  minutes: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function TimeField({
  label,
  accentColor,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  colors,
}: TimeFieldProps) {
  const [focused, setFocused] = useState<'h' | 'm' | null>(null);

  // Strip non-digits, clamp length to 2.
  const sanitize = (raw: string) => raw.replace(/[^0-9]/g, '').slice(0, 2);

  return (
    <View style={editorStyles.field}>
      <Text style={[editorStyles.fieldLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <View
        style={[
          editorStyles.fieldBox,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor:
              focused !== null ? accentColor : 'transparent',
          },
        ]}
      >
        <TextInput
          style={[editorStyles.digitInput, { color: colors.text }]}
          value={hours}
          onChangeText={(v) => onHoursChange(sanitize(v))}
          onFocus={() => setFocused('h')}
          onBlur={() => setFocused(null)}
          placeholder="00"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
        />
        <Text style={[editorStyles.digitSeparator, { color: colors.textMuted }]}>
          :
        </Text>
        <TextInput
          style={[editorStyles.digitInput, { color: colors.text }]}
          value={minutes}
          onChangeText={(v) => onMinutesChange(sanitize(v))}
          onFocus={() => setFocused('m')}
          onBlur={() => setFocused(null)}
          placeholder="00"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
        />
      </View>
      <View style={editorStyles.fieldHintRow}>
        <Text
          style={[editorStyles.fieldHint, { color: colors.textMuted }]}
        >
          SS
        </Text>
        <Text
          style={[editorStyles.fieldHint, { color: colors.textMuted }]}
        >
          DD
        </Text>
      </View>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero
  hero: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },

  // Card list
  cardList: {
    gap: 12,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  overnightChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  overnightChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  timeDash: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  cardCaption: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardChevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardChevronText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: -2,
  },

  // Footer hint
  footerHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 4,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  footerHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});

const editorStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  sheetWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
    opacity: 0.6,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  headerBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Inputs
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    gap: 4,
  },
  digitInput: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    width: 52,
    textAlign: 'center',
    padding: 0,
  },
  digitSeparator: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: -3,
  },
  fieldHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
  },
  fieldHint: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  separator: {
    paddingTop: 38,
    gap: 4,
    alignItems: 'center',
  },
  separatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Error
  errorBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Reset
  resetButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.6,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
