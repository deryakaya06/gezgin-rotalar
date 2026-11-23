import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { CLOUDINARY, COLLECTIONS, type Location, type WithId } from '@repo/shared';

import { db } from '@/lib/firebase';

export const CATEGORIES = ['Tarihi', 'Müze', 'Park', 'Manzara', 'Çarşı', 'Sokak', 'Ada', 'Lezzet'];

/** Mobil uygulamada eksik görünmemesi için bir mekanda bulunması gereken alanlar. */
export const RECOMMENDED_FIELDS = ['district', 'category', 'coordinates', 'coverPhotoUrl'] as const;

export function missingFields(location: Location) {
  return RECOMMENDED_FIELDS.filter((field) => !location[field]);
}

export async function fetchLocations(): Promise<WithId<Location>[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.locations));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Location) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

export async function fetchLocation(id: string): Promise<WithId<Location> | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.locations, id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Location) } : null;
}

/** "Karaköy Güllüoğlu" → "karakoy-gulluoglu" (scripts/locations.json'daki id biçimi). */
export function slugify(name: string) {
  return name
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Boş alanları atar; firestore.rules yalnızca bilinen alanlara izin verir. */
function clean(location: Location) {
  return Object.fromEntries(
    Object.entries(location).filter(([, value]) => value !== undefined && value !== '')
  );
}

/** Mekanı kaydeder. Yeni mekan için id addan üretilir; aynı id varsa sonuna sayı eklenir. */
export async function saveLocation(id: string | null, location: Location): Promise<string> {
  let targetId = id;
  if (!targetId) {
    const base = slugify(location.name) || 'mekan';
    targetId = base;
    for (let n = 2; (await getDoc(doc(db, COLLECTIONS.locations, targetId))).exists(); n++) {
      targetId = `${base}-${n}`;
    }
  }
  await setDoc(doc(db, COLLECTIONS.locations, targetId), {
    ...clean(location),
    updatedAt: serverTimestamp(),
  });
  return targetId;
}

export function deleteLocation(id: string) {
  return deleteDoc(doc(db, COLLECTIONS.locations, id));
}

/** OpenStreetMap'te adres/yer adı arar (İstanbul önceliğiyle). */
export async function geocode(query: string) {
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ format: 'json', limit: '5', countrycodes: 'tr', q: query });
  const res = await fetch(url, { headers: { 'Accept-Language': 'tr' } });
  if (!res.ok) throw new Error(`Konum araması başarısız (${res.status})`);
  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return results.map((r) => ({
    latitude: Number(Number(r.lat).toFixed(5)),
    longitude: Number(Number(r.lon).toFixed(5)),
    label: r.display_name,
  }));
}

/**
 * Seçilen görseli tarayıcıda en fazla 1600 px'e küçültür, JPEG'e çevirir ve
 * Cloudinary'ye yükler (mobil uygulamadaki gibi JSON + base64).
 */
export async function uploadCover(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: dataUrl, upload_preset: CLOUDINARY.uploadPreset }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Cloudinary ${res.status}`);
  return json.secure_url as string;
}

/** Cloudinary adresine boyut dönüşümü ekler (liste küçük resimleri için). */
export function thumbnail(url: string, width: number, height: number) {
  return url.replace('/image/upload/', `/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`);
}
