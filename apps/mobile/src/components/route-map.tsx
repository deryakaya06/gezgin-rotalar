import { useRef } from 'react';
import { StyleSheet, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { Coordinates } from '@repo/shared';

import { Radius } from '@/constants/theme';
import type { MapRoute } from '@/utils/route';

const SINGLE_STOP_DELTA = 0.02;
const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

/** Her kişinin duraklarını ve gidilen yolu kendi rengiyle gösteren harita. */
export function RouteMap({
  routes,
  paths,
  style,
}: {
  routes: MapRoute[];
  /** routes ile aynı sırada, animasyonun o ana kadar çizdiği yollar. */
  paths: Coordinates[][];
  style?: StyleProp<ViewStyle>;
}) {
  const scheme = useColorScheme();
  const mapRef = useRef<MapView>(null);
  const points = routes.flatMap((route) => route.stops.map((stop) => stop.coordinates));
  const first = points[0];

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={{ ...first, latitudeDelta: SINGLE_STOP_DELTA, longitudeDelta: SINGLE_STOP_DELTA }}
      onMapReady={() => {
        if (points.length > 1) {
          mapRef.current?.fitToCoordinates(points, { edgePadding: EDGE_PADDING, animated: false });
        }
      }}
      userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
      showsPointsOfInterests={false}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
    >
      {routes.map((route, routeIndex) =>
        paths[routeIndex]?.length > 1 ? (
          <Polyline
            key={route.id}
            coordinates={paths[routeIndex]}
            strokeColor={route.color}
            strokeWidth={4}
          />
        ) : null
      )}
      {routes.flatMap((route) =>
        route.stops.map((stop, index) => (
          <Marker
            key={`${route.id}-${stop.locationId}-${index}`}
            coordinate={stop.coordinates}
            title={`${index + 1}. ${stop.name}`}
            description={route.name}
            pinColor={route.color}
          />
        ))
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: Radius.large, overflow: 'hidden' },
});
