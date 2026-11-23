// Yalnızca web'de, yalnızca tarayıcıda yüklenir (route-map.web.tsx içinden lazy import).
import './leaflet.css';

import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import type { Coordinates } from '@repo/shared';

import { useTheme } from '@/hooks/use-theme';
import type { MapRoute } from '@/utils/route';

const SINGLE_STOP_ZOOM = 15;

const toLatLng = (point: Coordinates): [number, number] => [point.latitude, point.longitude];

export default function LeafletRouteMap({ routes, paths }: { routes: MapRoute[]; paths: Coordinates[][] }) {
  const theme = useTheme();
  const points = routes.flatMap((route) => route.stops.map((stop) => toLatLng(stop.coordinates)));
  const view =
    points.length > 1
      ? { bounds: points, boundsOptions: { padding: [36, 36] as [number, number] } }
      : { center: points[0], zoom: SINGLE_STOP_ZOOM };

  return (
    <MapContainer {...view} style={{ width: '100%', height: '100%' }} attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routes.map((route, routeIndex) =>
        paths[routeIndex]?.length > 1 ? (
          <Polyline
            key={route.id}
            positions={paths[routeIndex].map(toLatLng)}
            pathOptions={{ color: route.color, weight: 4 }}
          />
        ) : null
      )}
      {routes.flatMap((route) =>
        route.stops.map((stop, index) => (
          <CircleMarker
            key={`${route.id}-${stop.locationId}-${index}`}
            center={toLatLng(stop.coordinates)}
            radius={9}
            pathOptions={{ color: theme.background, weight: 2, fillColor: route.color, fillOpacity: 1 }}
          >
            <Tooltip>{`${route.name} · ${index + 1}. ${stop.name}`}</Tooltip>
          </CircleMarker>
        ))
      )}
    </MapContainer>
  );
}
