import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { DisplayFamily, Fonts, ManropeFamily, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'defaultSemiBold'
    | 'title'
    | 'heading'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

/**
 * Özel yazı tiplerinde fontWeight aileyi değiştirmez (Android'de yok sayar, iOS'ta
 * sahte kalınlık üretir). Bu yüzden istenen kalınlık Manrope'un ilgili ailesine çevrilir.
 */
function manropeFor(weight: unknown) {
  const w = Number(weight ?? 500);
  if (w >= 800) return ManropeFamily[800];
  if (w >= 700) return ManropeFamily[700];
  if (w >= 600) return ManropeFamily[600];
  return ManropeFamily[500];
}

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const flat: TextStyle | undefined = StyleSheet.flatten([typeStyles(type), style]);
  const font =
    type === 'code'
      ? null
      : DISPLAY_TYPES.has(type)
        ? { fontFamily: DisplayFamily, fontWeight: 'normal' as const }
        : { fontFamily: manropeFor(flat?.fontWeight), fontWeight: 'normal' as const };

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'title' && styles.title,
        type === 'heading' && styles.heading,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'caption' && styles.caption,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.linkPrimary, { color: theme.primary }],
        type === 'code' && styles.code,
        style,
        font,
      ]}
      {...rest}
    />
  );
}

/** Başlık türleri klasik serif (Cormorant Garamond), geri kalanı Manrope. */
const DISPLAY_TYPES = new Set<string>(['title', 'subtitle', 'heading']);

function typeStyles(type: NonNullable<ThemedTextProps['type']>) {
  return styles[type];
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 500,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
  title: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  /** Mekan ve kişi adları gibi kart başlıkları. */
  heading: {
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontWeight: 600,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
