import '@/global.css';

import { Platform } from 'react-native';

/**
 * Uygulamanın tek renk paleti — "Pastel": krem zemin, adaçayı yeşili ana renk,
 * pudra pembe vurgu ve eylem düğmeleri. Koyu modda sıcak kahve-siyah zemin.
 * Ekranlar renkleri useTheme() ile okur; bileşenlerde sabit renk (#...) yazılmaz.
 */
export const Colors = {
  light: {
    text: '#3E3A39',
    textSecondary: '#8A8380',
    background: '#FBF6F1',
    /** Kartların ve metin kutularının zemini (kremin üstünde beyaz). */
    surface: '#FFFFFF',
    backgroundElement: '#F3E9E2',
    backgroundSelected: '#EADDD4',
    border: '#F0E6DF',
    placeholder: '#B3AAA5',
    /** Kartların altındaki yumuşak pembe gölge. */
    shadow: '#E8A3A1',

    primary: '#5F7D69',
    onPrimary: '#FFFFFF',
    primarySoft: '#E6EEE8',
    accent: '#7C9A86',
    accentSoft: '#EEF3EF',
    highlight: '#D9827F',
    highlightSoft: '#FBE9E7',
    /** Check-in gibi ana eylem düğmeleri: pudra pembe üstünde koyu yazı. */
    cta: '#E8A3A1',
    onCta: '#3E3A39',
    danger: '#B4544B',
  },
  dark: {
    text: '#F3EBE6',
    textSecondary: '#ABA19C',
    background: '#1C1817',
    surface: '#262120',
    backgroundElement: '#302A28',
    backgroundSelected: '#3B3431',
    border: '#352E2C',
    placeholder: '#7D7471',
    shadow: '#000000',

    primary: '#A7C2AE',
    onPrimary: '#1C1817',
    primarySoft: '#2A322C',
    accent: '#A7C2AE',
    accentSoft: '#252C27',
    highlight: '#EBA9A6',
    highlightSoft: '#3A2927',
    cta: '#EBA9A6',
    onCta: '#1C1817',
    danger: '#E58C80',
  },
} as const;

/** Fotoğrafın üzerine binen yazı ve etiketler; fotoğraf her temada aynı göründüğü için sabit. */
export const OnPhoto = {
  scrim: 'rgba(40, 30, 28, 0.55)',
  text: '#FFFFFF',
  textSoft: 'rgba(255, 255, 255, 0.85)',
  rating: '#FFD9D4',
  badge: 'rgba(255, 255, 255, 0.9)',
  badgeText: '#5F7D69',
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
export const MaxContentWidth = 600;

/**
 * Ekran içeriğini en fazla MaxContentWidth genişlikte ortalar. Telefonda etkisizdir;
 * web ve tablette fotoğrafların ve kartların pencere boyunca devleşmesini önler.
 */
export const ContentColumn = {
  width: '100%',
  maxWidth: MaxContentWidth,
  alignSelf: 'center',
} as const;

export const Radius = {
  small: 12,
  medium: 18,
  large: 24,
  pill: 999,
} as const;

/** Başlıklar için yumuşak hatlı serif (Lora); yüklenmesi app/_layout.tsx'te. */
export const DisplayFamily = 'Lora_600SemiBold';

/** Gövde yazısı Nunito'nun ağırlıkları; yüklenmeleri app/_layout.tsx'te. */
export const BodyFamily = {
  500: 'Nunito_500Medium',
  600: 'Nunito_600SemiBold',
  700: 'Nunito_700Bold',
  800: 'Nunito_800ExtraBold',
} as const;
