'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { AdminShell } from '@/components/admin-shell';
import { fetchLocations } from '@/lib/locations';
import { fetchSponsorStats, type SponsorStats } from '@/lib/sponsor-stats';

import styles from '../page.module.css';

export default function SponsorsPage() {
  return (
    <AdminShell>
      <SponsorTable />
    </AdminShell>
  );
}

function SponsorTable() {
  const [stats, setStats] = useState<SponsorStats[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations()
      .then(fetchSponsorStats)
      .then(setStats)
      .catch((e: Error) => setError('İstatistikler yüklenemedi: ' + e.message));
  }, []);

  const total = (stats ?? []).reduce((sum, row) => sum + row.checkIns, 0);

  return (
    <>
      <div>
        <h1>Sponsor İstatistikleri</h1>
        <p className="muted">
          {stats ? `${stats.length} sponsorlu mekan · toplam ${total} check-in` : 'Yükleniyor…'}
        </p>
      </div>

      {error ? <p className="notice error">{error}</p> : null}

      <div className={`card ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mekan</th>
              <th>Sponsor</th>
              <th className={styles.num}>Check-in</th>
              <th className={styles.num}>Son 30 gün</th>
              <th className={styles.num}>Farklı ziyaretçi</th>
              <th className={styles.num}>Beğeni</th>
              <th>Son check-in</th>
            </tr>
          </thead>
          <tbody>
            {stats?.map((row) => (
              <tr key={row.location.id}>
                <td>
                  <Link href={`/locations/${row.location.id}`} className={styles.name}>
                    {row.location.name}
                  </Link>
                </td>
                <td>{row.location.sponsorInfo?.name ?? '—'}</td>
                <td className={`${styles.num} mono`}>{row.checkIns}</td>
                <td className={`${styles.num} mono`}>{row.recentCheckIns}</td>
                <td className={`${styles.num} mono`}>{row.visitors}</td>
                <td className={`${styles.num} mono`}>{row.likes}</td>
                <td>{row.lastCheckIn?.toLocaleDateString('tr-TR') ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats && stats.length === 0 ? <p className={`muted ${styles.empty}`}>Sponsorlu mekan yok.</p> : null}
      </div>
    </>
  );
}
