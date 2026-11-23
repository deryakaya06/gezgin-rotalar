import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** İçerik kutusu: krem zemin üstünde beyaz yüzey, çerçevesiz, yumuşak pembe gölge. */
export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    padding: Spacing.three,
    // Gölge çizilemeyen yerlerde (Android'in eski sürümleri) ince çerçeve kartı ayırır.
    borderWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 2,
  },
});
