import '@/global.css';

import { Platform } from 'react-native';

/**
 * Uygulamanın tek renk paleti. Ekranlar renkleri buradan useTheme() ile okur;
 * bileşenlerde sabit renk (#...) yazılmaz.
 */
export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#FFFFFF',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    border: '#E2E8F0',
    placeholder: '#94A3B8',

    primary: '#FF5733',
    onPrimary: '#FFFFFF',
    primarySoft: '#FFF1EC',
    accent: '#0D9488',
    accentSoft: '#CCFBF1',
    highlight: '#F59E0B',
    highlightSoft: '#FFE4D6',
    danger: '#DC2626',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#000000',
    backgroundElement: '#1C1F24',
    backgroundSelected: '#2A2E35',
    border: '#2A2E35',
    placeholder: '#64748B',

    primary: '#FF6B4A',
    onPrimary: '#FFFFFF',
    primarySoft: '#3A1D15',
    accent: '#2DD4BF',
    accentSoft: '#12322F',
    highlight: '#FBBF24',
    highlightSoft: '#3A2A12',
    danger: '#F87171',
  },
} as const;

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
  small: 8,
  medium: 12,
  large: 16,
  pill: 999,
} as const;
