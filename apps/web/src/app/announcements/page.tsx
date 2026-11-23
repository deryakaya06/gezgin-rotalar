'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Announcement, Location, WithId } from '@repo/shared';

import { AdminShell } from '@/components/admin-shell';
import { createAnnouncement, deleteAnnouncement, fetchAnnouncements } from '@/lib/announcements';
import { fetchLocations } from '@/lib/locations';

import styles from '../reports/reports.module.css';

export default function AnnouncementsPage() {
  return (
    <AdminShell>
      <AnnouncementManager />
    </AdminShell>
  );
}

function AnnouncementManager() {
  const [items, setItems] = useState<WithId<Announcement>[] | null>(null);
  const [sponsored, setSponsored] = useState<WithId<Location>[]>([]);
  const [locationId, setLocationId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    Promise.all([fetchAnnouncements(), fetchLocations()])
      .then(([announcements, locations]) => {
        setItems(announcements);
        setSponsored(locations.filter((l) => l.isSponsored));
      })
      .catch((e: Error) => setError('Duyurular yüklenemedi: ' + e.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const location = sponsored.find((l) => l.id === locationId);
    if (!location) return setError('Sponsorlu bir mekan seç.');
    if (title.trim().length < 2) return setError('Duyuru başlığını yaz.');
    setBusy(true);
    setError('');
    setSent(false);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        locationId: location.id,
        locationName: location.name,
      });
      setTitle('');
      setBody('');
      setSent(true);
      setItems(await fetchAnnouncements());
    } catch (e) {
      setError('Duyuru gönderilemedi: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: WithId<Announcement>) {
    if (!window.confirm(`"${item.title}" duyurusu silinsin mi?`)) return;
    try {
      await deleteAnnouncement(item.id);
      setItems((prev) => prev?.filter((a) => a.id !== item.id) ?? null);
    } catch (e) {
      setError('Duyuru silinemedi: ' + (e as Error).message);
    }
  }

  return (
    <>
      <div>
        <h1>Sponsor Duyuruları</h1>
        <p className="muted">Gönderilen duyuru bütün üyelerin bildirimlerinde görünür.</p>
      </div>

      {error ? <p className="notice error">{error}</p> : null}
      {sent ? <p className="notice ok">Duyuru gönderildi.</p> : null}

      <form className={`card ${styles.form}`} onSubmit={submit}>
        <label className="field" htmlFor="announcement-location">
          Sponsorlu mekan
          <select id="announcement-location" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">Seç…</option>
            {sponsored.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="announcement-title">
          Başlık
          <input id="announcement-title" type="text" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field" htmlFor="announcement-body">
          Metin
          <textarea id="announcement-body" maxLength={300} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? 'Gönderiliyor…' : 'Duyuruyu gönder'}
        </button>
      </form>

      <div className={styles.list}>
        {items?.map((item) => (
          <article key={item.id} className={`card ${styles.item} ${styles.noMedia}`}>
            <div className={styles.body}>
              <h2>{item.title}</h2>
              <p className="muted">
                {item.locationName}
                {item.createdAt ? ` · ${item.createdAt.toDate().toLocaleString('tr-TR')}` : ''}
              </p>
              {item.body ? <p className={styles.note}>{item.body}</p> : null}
            </div>
            <div className={styles.actions}>
              <button type="button" className="btn danger" onClick={() => remove(item)}>Sil</button>
            </div>
          </article>
        ))}
      </div>
      {items && items.length === 0 ? <p className="muted">Henüz duyuru yok.</p> : null}
    </>
  );
}
