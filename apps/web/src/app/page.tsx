'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Location, WithId } from '@repo/shared';

import { AdminShell } from '@/components/admin-shell';
import { fetchLocations, missingFields, thumbnail } from '@/lib/locations';

import styles from './page.module.css';

const FIELD_LABELS: Record<string, string> = {
  district: 'ilçe',
  category: 'kategori',
  coordinates: 'konum',
  coverPhotoUrl: 'kapak',
};

type Filter = 'all' | 'incomplete' | 'sponsored';

export default function LocationsPage() {
  return (
    <AdminShell>
      <LocationList />
    </AdminShell>
  );
}

function LocationList() {
  const [locations, setLocations] = useState<WithId<Location>[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetchLocations()
      .then(setLocations)
      .catch((e: Error) => setError('Mekanlar yüklenemedi: ' + e.message));
  }, []);

  const q = search.trim().toLocaleLowerCase('tr');
  const visible = (locations ?? []).filter((l) => {
    if (filter === 'incomplete' && missingFields(l).length === 0) return false;
    if (filter === 'sponsored' && !l.isSponsored) return false;
    return !q || [l.name, l.district, l.category].some((f) => f?.toLocaleLowerCase('tr').includes(q));
  });
  const incompleteCount = (locations ?? []).filter((l) => missingFields(l).length > 0).length;
  const sponsoredCount = (locations ?? []).filter((l) => l.isSponsored).length;

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Mekanlar</h1>
          <p className="muted">
            {locations ? `${locations.length} mekan · ${sponsoredCount} sponsorlu · ${incompleteCount} eksik bilgili` : 'Yükleniyor…'}
          </p>
        </div>
        <Link className="btn primary" href="/locations/new">
          + Yeni mekan
        </Link>
      </div>

      <div className={styles.tools}>
        <input
          id="search"
          type="search"
          placeholder="Ad, ilçe veya kategori ara"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Mekan ara"
        />
        <div className={styles.filters} role="group" aria-label="Filtre">
          {(
            [
              ['all', 'Tümü'],
              ['incomplete', `Eksik bilgili (${incompleteCount})`],
              ['sponsored', `Sponsorlu (${sponsoredCount})`],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`btn ${filter === value ? styles.active : ''}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="notice error">{error}</p> : null}

      <div className={`card ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th aria-label="Kapak" />
              <th>Mekan</th>
              <th>İlçe</th>
              <th>Kategori</th>
              <th className={styles.num}>Puan</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((l) => {
              const missing = missingFields(l);
              return (
                <tr key={l.id}>
                  <td className={styles.thumbCell}>
                    {l.coverPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Cloudinary zaten küçültüyor
                      <img className={styles.thumb} src={thumbnail(l.coverPhotoUrl, 96, 72)} alt="" />
                    ) : (
                      <span className={`${styles.thumb} ${styles.noThumb}`} />
                    )}
                  </td>
                  <td>
                    <Link href={`/locations/${l.id}`} className={styles.name}>
                      {l.name}
                    </Link>
                    <div className="muted mono">{l.id}</div>
                  </td>
                  <td>{l.district ?? '—'}</td>
                  <td>{l.category ?? '—'}</td>
                  <td className={`${styles.num} mono`}>{l.rating?.toFixed(1) ?? '—'}</td>
                  <td>
                    <div className={styles.pills}>
                      {l.isSponsored ? <span className="pill sponsor">Sponsorlu</span> : null}
                      {l.isFree ? <span className="pill free">Ücretsiz</span> : null}
                      {missing.length ? (
                        <span className="pill warn">Eksik: {missing.map((f) => FIELD_LABELS[f]).join(', ')}</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {locations && visible.length === 0 ? <p className={`muted ${styles.empty}`}>Bu filtrede mekan yok.</p> : null}
      </div>
    </>
  );
}
