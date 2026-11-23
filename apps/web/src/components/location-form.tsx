'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Location, WithId } from '@repo/shared';

import {
  CATEGORIES,
  deleteLocation,
  geocode,
  saveLocation,
  thumbnail,
  uploadCover,
} from '@/lib/locations';

import styles from './location-form.module.css';

type FormState = {
  name: string;
  description: string;
  district: string;
  category: string;
  latitude: string;
  longitude: string;
  rating: string;
  isFree: boolean;
  isSponsored: boolean;
  sponsorName: string;
  sponsorOffer: string;
  sponsorUrl: string;
  coverPhotoUrl: string;
  coverPhotoCredit: string;
  coverPhotoSource: string;
};

function toForm(l?: Location): FormState {
  return {
    name: l?.name ?? '',
    description: l?.description ?? '',
    district: l?.district ?? '',
    category: l?.category ?? '',
    latitude: l?.coordinates ? String(l.coordinates.latitude) : '',
    longitude: l?.coordinates ? String(l.coordinates.longitude) : '',
    rating: l?.rating !== undefined ? String(l.rating) : '',
    isFree: l?.isFree ?? false,
    isSponsored: l?.isSponsored ?? false,
    sponsorName: l?.sponsorInfo?.name ?? '',
    sponsorOffer: l?.sponsorInfo?.offer ?? '',
    sponsorUrl: l?.sponsorInfo?.url ?? '',
    coverPhotoUrl: l?.coverPhotoUrl ?? '',
    coverPhotoCredit: l?.coverPhotoCredit ?? '',
    coverPhotoSource: l?.coverPhotoSource ?? '',
  };
}

const parseNumber = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));

/** Formu Firestore belgesine çevirir; firestore.rules'taki validLocation ile aynı kuralları uygular. */
function toLocation(f: FormState): { location?: Location; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = f.name.trim();
  if (!name) errors.name = 'Ad zorunlu.';
  else if (name.length > 120) errors.name = 'En fazla 120 karakter.';
  if (f.description.length > 1000) errors.description = 'En fazla 1000 karakter.';

  const lat = parseNumber(f.latitude);
  const lng = parseNumber(f.longitude);
  let coordinates: Location['coordinates'];
  if (lat !== undefined || lng !== undefined) {
    if (lat === undefined || Number.isNaN(lat) || lat < -90 || lat > 90) errors.latitude = 'Enlem -90 ile 90 arasında olmalı.';
    if (lng === undefined || Number.isNaN(lng) || lng < -180 || lng > 180) errors.longitude = 'Boylam -180 ile 180 arasında olmalı.';
    if (!errors.latitude && !errors.longitude) coordinates = { latitude: lat!, longitude: lng! };
  }

  const rating = parseNumber(f.rating);
  if (rating !== undefined && (Number.isNaN(rating) || rating < 0 || rating > 5)) errors.rating = 'Puan 0 ile 5 arasında olmalı.';

  if (f.isSponsored && !f.sponsorName.trim()) errors.sponsorName = 'Sponsorlu mekanda sponsor adı zorunlu.';
  if (f.coverPhotoCredit.length > 200) errors.coverPhotoCredit = 'En fazla 200 karakter.';

  if (Object.keys(errors).length) return { errors };

  const location: Location = {
    name,
    description: f.description.trim(),
    isFree: f.isFree,
    isSponsored: f.isSponsored,
    sponsorInfo: f.isSponsored
      ? {
          name: f.sponsorName.trim(),
          ...(f.sponsorOffer.trim() ? { offer: f.sponsorOffer.trim() } : {}),
          ...(f.sponsorUrl.trim() ? { url: f.sponsorUrl.trim() } : {}),
        }
      : null,
    ...(f.district.trim() ? { district: f.district.trim() } : {}),
    ...(f.category.trim() ? { category: f.category.trim() } : {}),
    ...(coordinates ? { coordinates } : {}),
    ...(rating !== undefined ? { rating: Math.round(rating * 10) / 10 } : {}),
    ...(f.coverPhotoUrl ? { coverPhotoUrl: f.coverPhotoUrl } : {}),
    ...(f.coverPhotoCredit.trim() ? { coverPhotoCredit: f.coverPhotoCredit.trim() } : {}),
    ...(f.coverPhotoSource.trim() ? { coverPhotoSource: f.coverPhotoSource.trim() } : {}),
  };
  return { location, errors };
}

export function LocationForm({ initial }: { initial: WithId<Location> | null }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(initial ?? undefined));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geoResults, setGeoResults] = useState<Awaited<ReturnType<typeof geocode>> | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    const { location, errors: nextErrors } = toLocation(form);
    setErrors(nextErrors);
    if (!location) {
      setStatus({ kind: 'error', text: 'Kaydetmeden önce işaretli alanları düzelt.' });
      return;
    }
    setSaving(true);
    try {
      const id = await saveLocation(initial?.id ?? null, location);
      setStatus({ kind: 'ok', text: 'Kaydedildi. Mobil uygulamada bir sonraki açılışta görünür.' });
      if (!initial) router.replace(`/locations/${id}`);
    } catch (e) {
      const code = (e as { code?: string }).code;
      setStatus({
        kind: 'error',
        text: code === 'permission-denied'
          ? 'Sunucu kaydı reddetti. Hesabın admin olmayabilir ya da güncel kurallar yayında değil.'
          : 'Kaydedilemedi: ' + (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function onFindLocation() {
    const query = [form.name, form.district, 'İstanbul'].filter(Boolean).join(', ');
    setGeoBusy(true);
    setGeoResults(null);
    try {
      setGeoResults(await geocode(query));
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    } finally {
      setGeoBusy(false);
    }
  }

  async function onCoverSelected(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setStatus(null);
    try {
      const url = await uploadCover(file);
      setForm((f) => ({ ...f, coverPhotoUrl: url, coverPhotoSource: '' }));
    } catch (e) {
      setStatus({ kind: 'error', text: 'Fotoğraf yüklenemedi: ' + (e as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    setSaving(true);
    try {
      await deleteLocation(initial.id);
      router.replace('/');
    } catch (e) {
      setStatus({ kind: 'error', text: 'Silinemedi: ' + (e as Error).message });
      setSaving(false);
    }
  }

  const err = (key: string) =>
    errors[key] ? <span className={styles.error} role="alert">{errors[key]}</span> : null;
  const mapLink =
    form.latitude && form.longitude
      ? `https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=17/${form.latitude}/${form.longitude}`
      : null;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <section className={`card ${styles.section}`}>
        <h2>Temel bilgiler</h2>
        <label className="field" htmlFor="name">
          Ad
          <input id="name" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={120} required />
          {err('name')}
        </label>
        <label className="field" htmlFor="description">
          Açıklama
          <textarea id="description" value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={1000} />
          <span className="hint">{form.description.length}/1000</span>
          {err('description')}
        </label>
        <div className={styles.row}>
          <label className="field" htmlFor="district">
            İlçe
            <input id="district" type="text" value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="ör. Kadıköy" />
          </label>
          <label className="field" htmlFor="category">
            Kategori
            <select id="category" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Seç…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {form.category && !CATEGORIES.includes(form.category) ? <option value={form.category}>{form.category}</option> : null}
            </select>
          </label>
          <label className="field" htmlFor="rating">
            Puan (0–5)
            <input id="rating" type="number" inputMode="decimal" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => set('rating', e.target.value)} />
            {err('rating')}
          </label>
        </div>
        <label className="check" htmlFor="isFree">
          <input id="isFree" type="checkbox" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)} />
          Ücretsiz giriş
        </label>
      </section>

      <section className={`card ${styles.section}`}>
        <div className={styles.sectionHead}>
          <h2>Konum</h2>
          <button type="button" className="btn" onClick={onFindLocation} disabled={geoBusy || !form.name.trim()}>
            {geoBusy ? 'Aranıyor…' : 'Addan konum bul'}
          </button>
        </div>
        {geoResults ? (
          geoResults.length ? (
            <ul className={styles.geoList}>
              {geoResults.map((r) => (
                <li key={`${r.latitude},${r.longitude}`}>
                  <button
                    type="button"
                    className={styles.geoItem}
                    onClick={() => {
                      setForm((f) => ({ ...f, latitude: String(r.latitude), longitude: String(r.longitude) }));
                      setGeoResults(null);
                    }}
                  >
                    <span className="mono">{r.latitude}, {r.longitude}</span>
                    <span className="muted">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sonuç bulunamadı; koordinatları elle girebilirsin.</p>
          )
        ) : null}
        <div className={styles.row}>
          <label className="field" htmlFor="latitude">
            Enlem
            <input id="latitude" type="text" inputMode="decimal" className="mono" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="41.0256" />
            {err('latitude')}
          </label>
          <label className="field" htmlFor="longitude">
            Boylam
            <input id="longitude" type="text" inputMode="decimal" className="mono" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="28.9742" />
            {err('longitude')}
          </label>
        </div>
        {mapLink ? (
          <a className={styles.link} href={mapLink} target="_blank" rel="noreferrer">
            Haritada kontrol et ↗
          </a>
        ) : null}
      </section>

      <section className={`card ${styles.section}`}>
        <h2>Kapak fotoğrafı</h2>
        <div className={styles.cover}>
          {form.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary zaten küçültüyor
            <img className={styles.coverImg} src={thumbnail(form.coverPhotoUrl, 640, 400)} alt="Kapak önizlemesi" />
          ) : (
            <div className={`${styles.coverImg} ${styles.coverEmpty}`}>Fotoğraf yok</div>
          )}
          <div className={styles.coverSide}>
            <label className="btn" htmlFor="cover">
              {uploading ? 'Yükleniyor…' : form.coverPhotoUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}
            </label>
            <input id="cover" className={styles.hiddenInput} type="file" accept="image/*" disabled={uploading} onChange={(e) => onCoverSelected(e.target.files?.[0])} />
            {form.coverPhotoUrl ? (
              <button type="button" className="btn" onClick={() => setForm((f) => ({ ...f, coverPhotoUrl: '', coverPhotoCredit: '', coverPhotoSource: '' }))}>
                Kaldır
              </button>
            ) : null}
            <label className="field" htmlFor="coverPhotoCredit">
              Fotoğraf künyesi
              <input id="coverPhotoCredit" type="text" value={form.coverPhotoCredit} onChange={(e) => set('coverPhotoCredit', e.target.value)} placeholder="Fotoğrafçı · Lisans" maxLength={200} />
              <span className="hint">Başkasının fotoğrafıysa adı ve lisansı zorunlu; kendi fotoğrafınsa boş bırakabilirsin.</span>
              {err('coverPhotoCredit')}
            </label>
          </div>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <label className="check" htmlFor="isSponsored">
          <input id="isSponsored" type="checkbox" checked={form.isSponsored} onChange={(e) => set('isSponsored', e.target.checked)} />
          Sponsorlu mekan
        </label>
        <p className="muted">Sponsorlu mekanlar Keşfet&apos;te en üstte ve vurgulu gösterilir; detay sayfasında kampanya kartı çıkar.</p>
        {form.isSponsored ? (
          <div className={styles.row}>
            <label className="field" htmlFor="sponsorName">
              Sponsor adı
              <input id="sponsorName" type="text" value={form.sponsorName} onChange={(e) => set('sponsorName', e.target.value)} />
              {err('sponsorName')}
            </label>
            <label className="field" htmlFor="sponsorOffer">
              Kampanya metni
              <input id="sponsorOffer" type="text" value={form.sponsorOffer} onChange={(e) => set('sponsorOffer', e.target.value)} placeholder="ör. Check-in yapana %10 indirim" />
            </label>
            <label className="field" htmlFor="sponsorUrl">
              Bağlantı
              <input id="sponsorUrl" type="url" value={form.sponsorUrl} onChange={(e) => set('sponsorUrl', e.target.value)} placeholder="https://" />
            </label>
          </div>
        ) : null}
      </section>

      {status ? <p className={`notice ${status.kind}`} role="status">{status.text}</p> : null}

      <div className={styles.actions}>
        <button className="btn primary" type="submit" disabled={saving || uploading}>
          {saving ? 'Kaydediliyor…' : initial ? 'Değişiklikleri kaydet' : 'Mekanı oluştur'}
        </button>
        {initial ? (
          confirmDelete ? (
            <span className={styles.confirm}>
              <span>Mekan silinsin mi? Geçmiş check-in&apos;ler kalır.</span>
              <button type="button" className="btn danger solid" onClick={onDelete} disabled={saving}>Evet, sil</button>
              <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>Vazgeç</button>
            </span>
          ) : (
            <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>Mekanı sil</button>
          )
        ) : null}
      </div>
    </form>
  );
}
