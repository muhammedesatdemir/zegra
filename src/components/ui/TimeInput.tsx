/**
 * TimeInput
 *
 * Shared HH:mm time entry control. Two numeric fields (hours / minutes) with a
 * fixed ":" between them — the colon is rendered as static text, so it can
 * never be deleted, moved, or replaced with a "." by the user. Each field
 * accepts digits only and is clamped (hours 00–23, minutes 00–59). The numeric
 * keyboard is forced.
 *
 * Paste handling: when more than two characters land in a field (typical of a
 * paste like "07:30", "7.30", "0730"), the whole thing is run through
 * normalizeTimeString and split back into the two fields, so messy pastes are
 * absorbed into clean HH:mm instead of corrupting the format.
 *
 * Used by the shift-times editor and the day editor's "Bu Güne Özel Saat"
 * section so both behave identically.
 */

import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { ThemeColors } from '../../context';
import { parseHM } from '../../utils/shiftTime';

interface TimeInputProps {
  /** Current value as "HH:mm", or "" when empty. */
  value: string;
  /**
   * Called with the new value whenever either field changes. Emits a
   * zero-padded "HH:mm" once both fields have content, a partial string
   * (e.g. "07:" or ":30") while the user is mid-edit, or "" when cleared.
   */
  onChangeValue: (next: string) => void;
  accentColor: string;
  colors: ThemeColors;
  /** Placeholder shown when a field is empty (default "00"). */
  placeholderHours?: string;
  placeholderMinutes?: string;
}

/**
 * Normalize an arbitrary time-ish string into "HH:mm" (zero-padded), or null
 * if it can't be understood. Accepts "7.30", "7:30", "07.30", "0730", "730".
 */
export function normalizeTimeString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Has an explicit separator (":" or ".") — let parseHM handle it.
  if (/[.:]/.test(trimmed)) {
    const parsed = parseHM(trimmed);
    if (!parsed) return null;
    return `${String(parsed.hours).padStart(2, '0')}:${String(
      parsed.minutes
    ).padStart(2, '0')}`;
  }

  // Digits only: "0730" / "730" → split last two as minutes, rest as hours.
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length < 3 || digits.length > 4) return null;
  const h = Number(digits.slice(0, digits.length - 2));
  const m = Number(digits.slice(-2));
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function splitValue(value: string): { h: string; m: string } {
  if (!value) return { h: '', m: '' };
  const idx = value.indexOf(':');
  if (idx === -1) return { h: value.replace(/[^0-9]/g, '').slice(0, 2), m: '' };
  return {
    h: value.slice(0, idx).replace(/[^0-9]/g, '').slice(0, 2),
    m: value.slice(idx + 1).replace(/[^0-9]/g, '').slice(0, 2),
  };
}

export function TimeInput({
  value,
  onChangeValue,
  accentColor,
  colors,
  placeholderHours = '00',
  placeholderMinutes = '00',
}: TimeInputProps) {
  const [focused, setFocused] = useState<'h' | 'm' | null>(null);
  const { h, m } = useMemo(() => splitValue(value), [value]);

  // Re-assemble the "HH:mm" string from the two fields and emit it.
  const emit = (nextH: string, nextM: string) => {
    if (!nextH && !nextM) {
      onChangeValue('');
      return;
    }
    onChangeValue(`${nextH}:${nextM}`);
  };

  const handleHours = (raw: string) => {
    // Paste of a full time into the hours field — normalize and split.
    if (raw.length > 2 && /[.:]/.test(raw)) {
      const norm = normalizeTimeString(raw);
      if (norm) {
        onChangeValue(norm);
        return;
      }
    }
    let digits = raw.replace(/[^0-9]/g, '').slice(0, 2);
    if (digits.length === 2) {
      const n = Number(digits);
      if (n > 23) digits = '23';
    }
    emit(digits, m);
  };

  const handleMinutes = (raw: string) => {
    if (raw.length > 2 && /[.:]/.test(raw)) {
      const norm = normalizeTimeString(raw);
      if (norm) {
        onChangeValue(norm);
        return;
      }
    }
    let digits = raw.replace(/[^0-9]/g, '').slice(0, 2);
    if (digits.length === 2) {
      const n = Number(digits);
      if (n > 59) digits = '59';
    }
    emit(h, digits);
  };

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: focused !== null ? accentColor : 'transparent',
        },
      ]}
    >
      <TextInput
        style={[styles.digit, { color: colors.text }]}
        value={h}
        onChangeText={handleHours}
        onFocus={() => setFocused('h')}
        onBlur={() => setFocused(null)}
        placeholder={placeholderHours}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        underlineColorAndroid="transparent"
      />
      <Text style={[styles.separator, { color: colors.textMuted }]}>:</Text>
      <TextInput
        style={[styles.digit, { color: colors.text }]}
        value={m}
        onChangeText={handleMinutes}
        onFocus={() => setFocused('m')}
        onBlur={() => setFocused(null)}
        placeholder={placeholderMinutes}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    gap: 4,
  },
  digit: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    width: 52,
    textAlign: 'center',
    padding: 0,
  },
  separator: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: -3,
  },
});
