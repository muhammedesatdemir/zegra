/**
 * PressableScale
 *
 * Drop-in Pressable replacement that provides a consistent, premium press
 * feedback across iOS and Android:
 *  - Soft scale (0.97–0.98) + subtle opacity on press
 *  - Native Android ripple bounded to the component's border radius
 *  - No visual ripple overflow (wrapper is overflow: hidden when a radius is set)
 *
 * Keeps the same API as Pressable so existing styles keep working.
 */

import { forwardRef, useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** Scale factor when pressed. Default 0.97. Set to 1 to disable scaling. */
  pressedScale?: number;
  /** Opacity when pressed. Default 0.92 on iOS, 1 on Android (ripple handles feedback). */
  pressedOpacity?: number;
  /** Android ripple color. Default neutral subtle gray. Pass null to disable. */
  rippleColor?: string | null;
  /** When true, ripple extends beyond bounds. Default false (bounded). */
  rippleBorderless?: boolean;
  /** Optional radius hint used to clip Android ripple cleanly. */
  borderRadius?: number;
};

const DEFAULT_RIPPLE_LIGHT = 'rgba(0, 0, 0, 0.08)';

function flatten(style: StyleProp<ViewStyle>): ViewStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  return flat as ViewStyle;
}

export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  {
    style,
    pressedScale = 0.97,
    pressedOpacity,
    rippleColor = DEFAULT_RIPPLE_LIGHT,
    rippleBorderless = false,
    borderRadius,
    children,
    android_ripple,
    ...rest
  },
  ref
) {
  const android_ripple_effective = useMemo(() => {
    if (android_ripple !== undefined) return android_ripple;
    if (rippleColor === null) return undefined;
    return {
      color: rippleColor,
      borderless: rippleBorderless,
    };
  }, [android_ripple, rippleColor, rippleBorderless]);

  const resolvedPressedOpacity =
    pressedOpacity ?? (Platform.OS === 'ios' ? 0.92 : 1);

  const pressStyleFn = ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => {
    const base: StyleProp<ViewStyle> =
      typeof style === 'function' ? style({ pressed }) : style;

    if (!pressed) return base;

    const flatBase = flatten(base);
    const resolvedRadius =
      borderRadius ??
      (typeof flatBase.borderRadius === 'number' ? flatBase.borderRadius : undefined);

    const pressedOverlay: ViewStyle = {
      transform: [{ scale: pressedScale }],
      opacity: resolvedPressedOpacity,
      ...(resolvedRadius !== undefined && Platform.OS === 'android'
        ? { overflow: 'hidden', borderRadius: resolvedRadius }
        : {}),
    };

    return [base, pressedOverlay];
  };

  return (
    <Pressable
      ref={ref}
      style={pressStyleFn}
      android_ripple={android_ripple_effective}
      {...rest}
    >
      {children as any}
    </Pressable>
  );
});
