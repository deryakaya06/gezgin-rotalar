import type { CheckIn, Coordinates, WithId } from '@repo/shared';

export type RouteStop = {
  locationId: string;
  name: string;
  coordinates: Coordinates;
};

/** Haritada tek renkle çizilen, bir kişiye ait rota. */
export type MapRoute = {
  id: string;
  name: string;
  color: string;
  stops: RouteStop[];
};

/** Cihazın saat dilimine göre "2026-11-23" biçiminde gün anahtarı (takvimin beklediği biçim). */
export function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** createdAt henüz sunucudan dönmediyse check-in şu an yapılmış sayılır. */
function checkInTime(checkIn: CheckIn) {
  return checkIn.createdAt?.toDate?.() ?? new Date();
}

/** Check-in'leri güne göre gruplar; her gün kendi içinde saat sırasındadır. */
export function groupCheckInsByDay(checkIns: WithId<CheckIn>[]) {
  const days = new Map<string, WithId<CheckIn>[]>();
  const ordered = [...checkIns].sort((a, b) => checkInTime(a).getTime() - checkInTime(b).getTime());
  for (const checkIn of ordered) {
    const key = dayKey(checkInTime(checkIn));
    days.set(key, [...(days.get(key) ?? []), checkIn]);
  }
  return days;
}

/**
 * Bir günün check-in'lerini rota duraklarına çevirir. Konumu olmayan mekanlar atlanır;
 * aynı mekanda art arda yapılan check-in'ler tek durak sayılır.
 */
export function routeStops(
  dayCheckIns: WithId<CheckIn>[],
  coordinatesById: ReadonlyMap<string, Coordinates>
) {
  const stops: RouteStop[] = [];
  for (const checkIn of dayCheckIns) {
    const coordinates = coordinatesById.get(checkIn.locationId);
    if (!coordinates || stops.at(-1)?.locationId === checkIn.locationId) continue;
    stops.push({ locationId: checkIn.locationId, name: checkIn.locationName, coordinates });
  }
  return stops;
}

/** Rotanın baştan progress (0–1) oranına kadar olan kısmı; çizgi sabit hızla ilerler. */
export function pathAt(points: Coordinates[], progress: number): Coordinates[] {
  if (points.length < 2) return points;
  const lengths = points.slice(1).map((point, i) =>
    Math.hypot(point.latitude - points[i].latitude, point.longitude - points[i].longitude)
  );
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (total === 0 || progress >= 1) return points;

  let remaining = Math.max(progress, 0) * total;
  const path = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (remaining >= lengths[i]) {
      remaining -= lengths[i];
      path.push(points[i + 1]);
      continue;
    }
    const ratio = lengths[i] === 0 ? 0 : remaining / lengths[i];
    path.push({
      latitude: points[i].latitude + (points[i + 1].latitude - points[i].latitude) * ratio,
      longitude: points[i].longitude + (points[i + 1].longitude - points[i].longitude) * ratio,
    });
    break;
  }
  return path;
}
