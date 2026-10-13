import { StyleSheet, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import type { Location, WithId } from '@repo/shared';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ISTANBUL_REGION } from '@/services/locations';

type Props = {
  locations: WithId<Location>[];
  /** Bilgi balonuna dokunulunca çağrılır. */
  onSelect?: (location: WithId<Location>) => void;
  initialRegion?: Region;
  /** false ise harita sabit durur (detay ekranındaki küçük önizleme gibi). */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Mekanları işaretçi olarak gösteren harita. Konumu olmayan mekanlar atlanır. */
export function LocationMap({ locations, onSelect, initialRegion, interactive = true, style }: Props) {
  const theme = useTheme();
  const scheme = useColorScheme();

  return (
    <MapView
      style={[styles.map, style]}
      initialRegion={initialRegion ?? ISTANBUL_REGION}
      userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
      showsPointsOfInterests={false}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
    >
      {locations.map((location) =>
        location.coordinates ? (
          <Marker
            key={location.id}
            coordinate={location.coordinates}
            title={location.name}
            description={[location.category, location.district].filter(Boolean).join(' · ')}
            pinColor={location.isSponsored ? theme.highlight : theme.primary}
            onCalloutPress={onSelect ? () => onSelect(location) : undefined}
          />
        ) : null
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: Radius.large, overflow: 'hidden' },
});
