import { lazy, Suspense, useSyncExternalStore } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Region } from 'react-native-maps';
import type { Location, WithId } from '@repo/shared';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// react-native-maps web'de çalışmaz; web'de Leaflet + OpenStreetMap kullanılır.
const LeafletMap = lazy(() => import('./location-map-leaflet'));

type Props = {
  locations: WithId<Location>[];
  onSelect?: (location: WithId<Location>) => void;
  initialRegion?: Region;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

const subscribe = () => () => {};

export function LocationMap({ locations, onSelect, initialRegion, interactive = true, style }: Props) {
  const theme = useTheme();
  // Sunucu çiziminde false, tarayıcıda true: Leaflet yalnızca tarayıcıda yüklenebilir.
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  return (
    <View style={[styles.box, { backgroundColor: theme.backgroundElement }, style]}>
      {inBrowser ? (
        <Suspense fallback={null}>
          <LeafletMap
            locations={locations}
            onSelect={onSelect}
            initialRegion={initialRegion}
            interactive={interactive}
          />
        </Suspense>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: 120, borderRadius: Radius.large, overflow: 'hidden' },
});
