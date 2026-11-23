import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TONES = {
  primary: { background: 'primarySoft', text: 'primary' },
  accent: { background: 'accentSoft', text: 'accent' },
} as const;

/** Küçük, renkli bilgi etiketi (ör. "+10 puan", mekan adı). */
export function Tag({ label, tone = 'primary' }: { label: string; tone?: keyof typeof TONES }) {
  const theme = useTheme();
  const colors = TONES[tone];

  return (
    <View style={[styles.tag, { backgroundColor: theme[colors.background] }]}>
      <ThemedText type="caption" style={[styles.text, { color: theme[colors.text] }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: { fontWeight: 600, letterSpacing: 0.2 },
});
