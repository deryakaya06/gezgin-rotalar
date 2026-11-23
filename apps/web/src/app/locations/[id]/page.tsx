'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Location, WithId } from '@repo/shared';

import { AdminShell } from '@/components/admin-shell';
import { LocationForm } from '@/components/location-form';
import { fetchLocation } from '@/lib/locations';

export default function LocationPage() {
  return (
    <AdminShell>
      <LocationEditor />
    </AdminShell>
  );
}

function LocationEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const [location, setLocation] = useState<WithId<Location> | null | undefined>(isNew ? null : undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    fetchLocation(id)
      .then((l) => (l ? setLocation(l) : setError('Bu mekan bulunamadı.')))
      .catch((e: Error) => setError('Mekan yüklenemedi: ' + e.message));
  }, [id, isNew]);

  return (
    <>
      <div>
        <Link href="/" className="muted">← Mekanlar</Link>
        <h1>{isNew ? 'Yeni mekan' : (location?.name ?? 'Mekan')}</h1>
        {!isNew && location ? <p className="muted mono">{location.id}</p> : null}
      </div>
      {error ? <p className="notice error">{error}</p> : null}
      {location !== undefined ? <LocationForm key={location?.id ?? 'new'} initial={location} /> : !error ? <p className="muted">Yükleniyor…</p> : null}
    </>
  );
}
