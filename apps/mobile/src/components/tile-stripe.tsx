import { StyleSheet, View } from 'react-native';

import { TileColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SEGMENTS = 40;

/**
 * İznik çinisinden esinlenen ince renkli bordür; sekme ekranlarının en üstünde.
 * inset: kapsayıcının yan ve üst iç boşluğu; bordür bu boşluğu taşarak kenardan kenara uzanır.
 */
export function TileStripe({ inset = 0 }: { inset?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.stripe, { marginHorizontal: -inset, marginTop: -inset, marginBottom: inset }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.tile,
            { backgroundColor: TileColors[i % TileColors.length], borderRightColor: theme.background },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stripe: { flexDirection: 'row', height: 5, overflow: 'hidden' },
  tile: { width: 14, borderRightWidth: 4 },
});
