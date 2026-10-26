import '@/global.css';

import { Platform } from 'react-native';

/**
 * Uygulamanın tek renk paleti — "Pera Palas": fildişi zemin, şişe yeşili ana renk,
 * pirinç vurgu. Koyu modda koyu yeşil-siyah zemin ve pirinç. Ekranlar renkleri
 * useTheme() ile okur; bileşenlerde sabit renk (#...) yazılmaz.
 */
export const Colors = {
  light: {
    text: '#1E2A25',
    textSecondary: '#6F716A',
    background: '#F6F2EA',
    /** Kartların ve metin kutularının zemini (fildişi üstünde biraz daha açık). */
    surface: '#FFFDF8',
    backgroundElement: '#ECE5D6',
    backgroundSelected: '#E2D9C6',
    border: '#E2DACB',
    placeholder: '#A19C90',

    primary: '#1F3A33',
    onPrimary: '#F6F2EA',
    primarySoft: '#E4E9E2',
    accent: '#4F6F5F',
    accentSoft: '#E3EAE2',
    highlight: '#A9844F',
    highlightSoft: '#F1E8D8',
    danger: '#9B3B2E',
  },
  dark: {
    text: '#EFE9DD',
    textSecondary: '#A7A496',
    background: '#121815',
    surface: '#1A221E',
    backgroundElement: '#232C27',
    backgroundSelected: '#2D3832',
    border: '#2A332E',
    placeholder: '#77786E',

    primary: '#C9A774',
    onPrimary: '#121815',
    primarySoft: '#2A2A1F',
    accent: '#9DB8A4',
    accentSoft: '#1F2B25',
    highlight: '#C9A774',
    highlightSoft: '#2E281D',
    danger: '#E07A6A',
  },
} as const;

/** Fotoğrafın üzerine binen yazı ve etiketler; fotoğraf her temada aynı göründüğü için sabit. */
export const OnPhoto = {
  scrim: 'rgba(14, 20, 17, 0.62)',
  text: '#FFFFFF',
  textSoft: 'rgba(255, 255, 255, 0.82)',
  rating: '#EED9B3',
  badge: 'rgba(255, 253, 248, 0.9)',
  badgeText: '#1E2A25',
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
  small: 8,
  medium: 12,
  large: 18,
  pill: 999,
} as const;

/** Başlıklar için yüksek kontrastlı serif (Pera Palas yönü); yüklenmesi app/_layout.tsx'te. */
export const DisplayFamily = 'PlayfairDisplay_600SemiBold';

/** Manrope ağırlıkları; yüklenmeleri app/_layout.tsx'te. */
export const ManropeFamily = {
  500: 'Manrope_500Medium',
  600: 'Manrope_600SemiBold',
  700: 'Manrope_700Bold',
  800: 'Manrope_800ExtraBold',
} as const;
