import { lazy, Suspense, useSyncExternalStore } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Coordinates } from '@repo/shared';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MapRoute } from '@/utils/route';

// react-native-maps web'de çalışmaz; web'de Leaflet + OpenStreetMap kullanılır.
const LeafletRouteMap = lazy(() => import('./route-map-leaflet'));

const subscribe = () => () => {};

export function RouteMap({
  routes,
  paths,
  style,
}: {
  routes: MapRoute[];
  paths: Coordinates[][];
  style?: StyleProp<ViewStyle>;
}) {
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
          <LeafletRouteMap routes={routes} paths={paths} />
        </Suspense>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: 120, borderRadius: Radius.large, overflow: 'hidden' },
});
