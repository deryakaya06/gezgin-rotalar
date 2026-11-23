'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SuggestedLocation, WithId } from '@repo/shared';

import { AdminShell } from '@/components/admin-shell';
import { approveSuggestion, fetchPendingSuggestions, rejectSuggestion } from '@/lib/suggestions';

import styles from '../reports/reports.module.css';

export default function SuggestionsPage() {
  return (
    <AdminShell>
      <SuggestionList />
    </AdminShell>
  );
}

function SuggestionList() {
  const [items, setItems] = useState<WithId<SuggestedLocation>[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchPendingSuggestions()
      .then(setItems)
      .catch((e: Error) => setError('Öneriler yüklenemedi: ' + e.message));
  }, []);

  async function review(item: WithId<SuggestedLocation>, approve: boolean) {
    setBusyId(item.id);
    setError('');
    setCreated(null);
    try {
      if (approve) {
        const id = await approveSuggestion(item);
        setCreated({ id, name: item.name });
      } else {
        await rejectSuggestion(item);
      }
      setItems((prev) => prev?.filter((s) => s.id !== item.id) ?? null);
    } catch (e) {
      setError('İşlem yapılamadı: ' + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div>
        <h1>Mekan Önerileri</h1>
        <p className="muted">{items ? `${items.length} öneri bekliyor` : 'Yükleniyor…'}</p>
      </div>

      {error ? <p className="notice error">{error}</p> : null}
      {created ? (
        <p className="notice ok">
          {created.name} mekanlara eklendi. Haritada görünmesi için{' '}
          <Link href={`/locations/${created.id}`}>konumunu ve kapak fotoğrafını ekle</Link>.
        </p>
      ) : null}
      {items && items.length === 0 ? <p className="card notice">Bekleyen öneri yok.</p> : null}

      <div className={styles.list}>
        {items?.map((item) => (
          <article key={item.id} className={`card ${styles.item} ${styles.noMedia}`}>
            <div className={styles.body}>
              <h2>{item.name}</h2>
              <p className="muted">{item.district} · {item.category} · Öneren: {item.userName}</p>
              {item.description ? <p className={styles.note}>{item.description}</p> : null}
              <div className={styles.reasons}>
                <span className="pill free">{item.voteCount} oy</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className="btn primary" disabled={busyId === item.id} onClick={() => review(item, true)}>
                Onayla ve ekle
              </button>
              <button type="button" className="btn" disabled={busyId === item.id} onClick={() => review(item, false)}>
                Reddet
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
