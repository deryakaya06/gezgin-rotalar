import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Temaya uyan metin kutusu; karanlık modda da okunur. */
export function TextField({ style, ...rest }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.placeholder}
      selectionColor={theme.primary}
      style={[
        styles.input,
        { borderColor: theme.border, color: theme.text, backgroundColor: theme.background },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
