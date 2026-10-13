import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { COLLECTIONS, type Location, type WithId } from '@repo/shared';

import { db } from '@/firebase';

/** Sponsorlu mekanlar önce, sonra puana ve ada göre sıralanmış tüm mekanlar. */
export async function fetchLocations(): Promise<WithId<Location>[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.locations));
  const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Location) }));
  return items.sort(
    (a, b) =>
      Number(!!b.isSponsored) - Number(!!a.isSponsored) ||
      (b.rating ?? 0) - (a.rating ?? 0) ||
      a.name.localeCompare(b.name, 'tr')
  );
}

export async function fetchLocation(id: string): Promise<WithId<Location> | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.locations, id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Location) } : null;
}

/** Cihazın harita uygulamasında yol tarifi bağlantısı. */
export function directionsUrl(location: Location, platform: 'ios' | 'android' | string) {
  const { latitude, longitude } = location.coordinates!;
  const label = encodeURIComponent(location.name);
  return platform === 'ios'
    ? `maps:?daddr=${latitude},${longitude}&q=${label}`
    : `geo:0,0?q=${latitude},${longitude}(${label})`;
}

/** İstanbul'u ortalayan başlangıç bölgesi. */
export const ISTANBUL_REGION = {
  latitude: 41.03,
  longitude: 29.0,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};

export const LOCATION_FILTERS = ['Tümü', 'Yüksek Puanlı (4.5+)', 'Ücretsiz Giriş'] as const;
export type LocationFilter = (typeof LOCATION_FILTERS)[number];

/** Arama metni (ad, ilçe, kategori), filtre ve ilçeye göre süzer. */
export function filterLocations(
  locations: WithId<Location>[],
  { search, filter, district }: { search: string; filter: LocationFilter; district: string | null }
) {
  const q = search.trim().toLocaleLowerCase('tr');
  return locations.filter((l) => {
    if (district && l.district !== district) return false;
    if (filter === 'Yüksek Puanlı (4.5+)' && (l.rating ?? 0) < 4.5) return false;
    if (filter === 'Ücretsiz Giriş' && !l.isFree) return false;
    if (!q) return true;
    return [l.name, l.district, l.category].some((field) =>
      field?.toLocaleLowerCase('tr').includes(q)
    );
  });
}

/** Mekanlarda geçen ilçeler, en çok mekanı olan önce. */
export function districtsOf(locations: WithId<Location>[]) {
  const counts = new Map<string, number>();
  for (const l of locations) if (l.district) counts.set(l.district, (counts.get(l.district) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}
