// Yalnızca web'de, yalnızca tarayıcıda yüklenir (location-map.web.tsx içinden lazy import);
// Leaflet içe aktarılırken window'a eriştiği için sunucu çiziminde yüklenemez.
import './leaflet.css';

import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import type { Region } from 'react-native-maps';
import type { Location, WithId } from '@repo/shared';

import { ManropeFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ISTANBUL_REGION } from '@/services/locations';

type Props = {
  locations: WithId<Location>[];
  onSelect?: (location: WithId<Location>) => void;
  initialRegion?: Region;
  interactive: boolean;
};

/** react-native-maps'teki latitudeDelta'yı Leaflet yakınlaştırma seviyesine çevirir. */
function zoomFor(region: Region) {
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / region.latitudeDelta))));
}

export default function LeafletMap({ locations, onSelect, initialRegion, interactive }: Props) {
  const theme = useTheme();
  const region = initialRegion ?? ISTANBUL_REGION;

  return (
    <MapContainer
      center={[region.latitude, region.longitude]}
      zoom={zoomFor(region)}
      style={{ width: '100%', height: '100%' }}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      zoomControl={interactive}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) =>
        location.coordinates ? (
          <CircleMarker
            key={location.id}
            center={[location.coordinates.latitude, location.coordinates.longitude]}
            radius={9}
            pathOptions={{
              color: theme.background,
              weight: 2,
              fillColor: location.isSponsored ? theme.highlight : theme.primary,
              fillOpacity: 1,
            }}
          >
            {interactive ? (
              <Popup>
                <div style={{ fontFamily: ManropeFamily[500], display: 'grid', gap: 4 }}>
                  <strong style={{ fontFamily: ManropeFamily[700] }}>{location.name}</strong>
                  <span>{[location.category, location.district].filter(Boolean).join(' · ')}</span>
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(location)}
                      style={{
                        marginTop: 4,
                        padding: '6px 10px',
                        border: 0,
                        borderRadius: 8,
                        background: theme.primary,
                        color: theme.onPrimary,
                        fontFamily: ManropeFamily[700],
                        cursor: 'pointer',
                      }}
                    >
                      Detayı aç
                    </button>
                  ) : null}
                </div>
              </Popup>
            ) : null}
          </CircleMarker>
        ) : null
      )}
    </MapContainer>
  );
}
