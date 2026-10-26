import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** Seçilebilir sekme/filtre: seçili olan koyu yazı ve pirinç renginde alt çizgiyle belirtilir. */
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
      style={[styles.chip, { borderBottomColor: selected ? theme.highlight : 'transparent' }]}
    >
      <ThemedText
        type={selected ? 'smallBold' : 'small'}
        themeColor={selected ? 'text' : 'textSecondary'}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
});
