'use client';

import { useCallback, useEffect, useState } from 'react';
import { REPORT_REASONS } from '@repo/shared';

import { AdminShell } from '@/components/admin-shell';
import { thumbnail } from '@/lib/locations';
import { dismissReports, fetchReportGroups, removeCheckIn, type ReportGroup } from '@/lib/moderation';

import styles from './reports.module.css';

export default function ReportsPage() {
  return (
    <AdminShell>
      <ReportList />
    </AdminShell>
  );
}

function reasonSummary(group: ReportGroup) {
  const counts = new Map<string, number>();
  for (const report of group.reports) {
    const label = REPORT_REASONS[report.reason];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => `${label} (${count})`);
}

function ReportList() {
  const [groups, setGroups] = useState<ReportGroup[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return fetchReportGroups()
      .then(setGroups)
      .catch((e: Error) => setError('Şikâyetler yüklenemedi: ' + e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(group: ReportGroup, action: (g: ReportGroup) => Promise<void>) {
    setBusyId(group.checkInId);
    setError('');
    try {
      await action(group);
      setGroups((prev) => prev?.filter((g) => g.checkInId !== group.checkInId) ?? null);
    } catch (e) {
      setError('İşlem yapılamadı: ' + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function remove(group: ReportGroup) {
    const points = group.checkIn?.points ?? 0;
    const message =
      `${group.checkIn?.locationName ?? 'Bu'} paylaşımı kaldırılsın mı?` +
      (points > 0 ? ` ${group.ownerName} hesabından ${points} puan düşülecek.` : '');
    if (window.confirm(message)) act(group, removeCheckIn);
  }

  return (
    <>
      <div>
        <h1>Şikâyetler</h1>
        <p className="muted">
          {groups ? `${groups.length} paylaşım inceleme bekliyor` : 'Yükleniyor…'}
        </p>
      </div>

      {error ? <p className="notice error">{error}</p> : null}
      {groups && groups.length === 0 ? <p className="card notice">Bekleyen şikâyet yok.</p> : null}

      <div className={styles.list}>
        {groups?.map((group) => (
          <article key={group.checkInId} className={`card ${styles.item}`}>
            {group.checkIn?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Cloudinary zaten küçültüyor
              <img className={styles.photo} src={thumbnail(group.checkIn.photoUrl, 240, 240)} alt="" />
            ) : (
              <span className={`${styles.photo} ${styles.noPhoto}`} />
            )}
            <div className={styles.body}>
              <h2>{group.checkIn?.locationName ?? 'Paylaşım silinmiş'}</h2>
              <p className="muted">
                {group.ownerName}
                {group.checkIn?.createdAt ? ` · ${group.checkIn.createdAt.toDate().toLocaleString('tr-TR')}` : ''}
              </p>
              {group.checkIn?.note ? <p className={styles.note}>{group.checkIn.note}</p> : null}
              <div className={styles.reasons}>
                <span className="pill warn">{group.reports.length} şikâyet</span>
                {reasonSummary(group).map((reason) => (
                  <span key={reason} className="pill free">{reason}</span>
                ))}
              </div>
            </div>
            <div className={styles.actions}>
              {group.checkIn ? (
                <button
                  type="button"
                  className="btn danger"
                  disabled={busyId === group.checkInId}
                  onClick={() => remove(group)}
                >
                  Paylaşımı kaldır
                </button>
              ) : null}
              <button
                type="button"
                className="btn"
                disabled={busyId === group.checkInId}
                onClick={() => act(group, dismissReports)}
              >
                Şikâyeti kapat
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
