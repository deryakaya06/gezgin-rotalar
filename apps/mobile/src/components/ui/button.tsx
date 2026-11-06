import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  /** primary: dolu pudra pembe (ana eylem), outline: adaçayı yeşili çerçeveli. */
  variant?: 'primary' | 'outline';
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'primary',
  size = 'large',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const filled = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.large,
        {
          borderColor: filled ? theme.cta : theme.primary,
          backgroundColor: filled ? theme.cta : 'transparent',
        },
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
      {...rest}
    >
      <ThemedText
        type={size === 'small' ? 'caption' : 'smallBold'}
        style={[styles.text, { color: filled ? theme.onCta : theme.primary }]}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
  },
  small: {
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  text: { fontWeight: 600, letterSpacing: 0.3 },
  dimmed: { opacity: 0.6 },
});
