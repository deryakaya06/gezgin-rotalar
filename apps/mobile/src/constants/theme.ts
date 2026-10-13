import '@/global.css';

import { Platform } from 'react-native';

/**
 * Uygulamanın tek renk paleti — "İznik" yönü: çininin kobalt mavisi ana renk,
 * mercan kırmızısı ve çini yeşili vurgular. Ekranlar renkleri useTheme() ile okur;
 * bileşenlerde sabit renk (#...) yazılmaz.
 */
export const Colors = {
  light: {
    text: '#0B1F5C',
    textSecondary: '#56628A',
    background: '#FFFFFF',
    backgroundElement: '#EEF1FB',
    backgroundSelected: '#D8DEF2',
    border: '#D8DEF2',
    placeholder: '#8A93B5',

    primary: '#1D3FB8',
    onPrimary: '#FFFFFF',
    primarySoft: '#E6EBFA',
    accent: '#2E9C8E',
    accentSoft: '#DDF2EF',
    highlight: '#C2372A',
    highlightSoft: '#FCE5E1',
    danger: '#B42318',
  },
  dark: {
    text: '#EEF1FB',
    textSecondary: '#A6B0D6',
    background: '#0A1233',
    backgroundElement: '#131D45',
    backgroundSelected: '#1E2A5C',
    border: '#24316A',
    placeholder: '#6F7AA6',

    primary: '#5B78F0',
    onPrimary: '#FFFFFF',
    primarySoft: '#1B2759',
    accent: '#4CC2B2',
    accentSoft: '#12332F',
    highlight: '#F0705F',
    highlightSoft: '#3A1A17',
    danger: '#F87171',
  },
} as const;

/** Fotoğrafın üzerine binen etiketler; fotoğraf her temada aynı göründüğü için sabit. */
export const OnPhoto = {
  scrim: 'rgba(11, 31, 92, 0.72)',
  text: '#FFFFFF',
} as const;

/** Çini bordüründeki renk sırası (açık ve koyu temada aynı). */
export const TileColors = ['#1D3FB8', '#C2372A', '#2E9C8E'] as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Radius = {
  small: 6,
  medium: 10,
  large: 12,
  /** Çipler ve etiketler; İznik yönünde tam yuvarlak yerine hafif köşeli. */
  pill: 8,
} as const;

/** Manrope ağırlıkları; yüklenmeleri app/_layout.tsx'te. */
export const ManropeFamily = {
  500: 'Manrope_500Medium',
  600: 'Manrope_600SemiBold',
  700: 'Manrope_700Bold',
  800: 'Manrope_800ExtraBold',
} as const;
