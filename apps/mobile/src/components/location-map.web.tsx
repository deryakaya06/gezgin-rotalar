import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Region } from 'react-native-maps';
import type { Location, WithId } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  locations: WithId<Location>[];
  onSelect?: (location: WithId<Location>) => void;
  initialRegion?: Region;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** react-native-maps web'de çalışmaz (Marker yalnızca mobil); yerine bilgi kutusu gösterilir. */
export function LocationMap({ style }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.backgroundElement }, style]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        Harita yalnızca mobil uygulamada görünür.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 120,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  text: { textAlign: 'center' },
});
