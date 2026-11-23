import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Seçilebilir sekme/filtre: yuvarlak hap; seçili olan adaçayı yeşili zemin üstünde beyaz yazıyla. */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? theme.primary : theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText
        type={selected ? 'smallBold' : 'small'}
        style={{ color: selected ? theme.onPrimary : theme.textSecondary }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
  },
  pressed: { opacity: 0.75 },
});
