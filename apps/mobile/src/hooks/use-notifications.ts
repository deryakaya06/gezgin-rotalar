import { useEffect, useMemo, useState } from 'react';
import type { Announcement, AppNotification, FirestoreTimestamp, WithId } from '@repo/shared';

import { useAuth } from '@/context/auth';
import { useBlockedUsers } from '@/hooks/use-blocked-users';
import {
  subscribeAnnouncements,
  subscribeAnnouncementsSeenAt,
  subscribeNotifications,
} from '@/services/notifications';

export type NotificationItem =
  | { kind: 'notification'; key: string; time: number; unread: boolean; data: WithId<AppNotification> }
  | { kind: 'announcement'; key: string; time: number; unread: boolean; data: WithId<Announcement> };

const millis = (timestamp: FirestoreTimestamp | null | undefined) =>
  timestamp?.toDate?.().getTime() ?? 0;

/** Kişisel bildirimler ve sponsor duyuruları tek listede, en yeni önce. */
export function useNotifications() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { blockedIds } = useBlockedUsers();
  const [notifications, setNotifications] = useState<{ uid: string; items: WithId<AppNotification>[] } | null>(null);
  const [announcements, setAnnouncements] = useState<WithId<Announcement>[]>([]);
  const [seen, setSeen] = useState<{ uid: string; at: FirestoreTimestamp | null } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    return subscribeNotifications(
      uid,
      (items) => setNotifications({ uid, items }),
      (e) => setError('Bildirimler yüklenemedi: ' + e.message)
    );
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return subscribeAnnouncements(setAnnouncements, (e) => setError('Duyurular yüklenemedi: ' + e.message));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return subscribeAnnouncementsSeenAt(
      uid,
      (at) => setSeen({ uid, at }),
      (e) => setError('Bildirim durumu yüklenemedi: ' + e.message)
    );
  }, [uid]);

  const loaded = notifications?.uid === uid && seen?.uid === uid;
  const seenAt = seen && seen.uid === uid ? millis(seen.at) : 0;
  const own = notifications && notifications.uid === uid ? notifications.items : null;

  const items = useMemo<NotificationItem[]>(() => {
    if (!own) return [];
    const personal = own
      .filter((data) => !blockedIds.has(data.actorId))
      .map((data): NotificationItem => ({
        kind: 'notification',
        key: `n-${data.id}`,
        time: millis(data.createdAt),
        unread: !data.read,
        data,
      }));
    const broadcast = announcements.map((data): NotificationItem => ({
      kind: 'announcement',
      key: `a-${data.id}`,
      time: millis(data.createdAt),
      unread: millis(data.createdAt) > seenAt,
      data,
    }));
    return [...personal, ...broadcast].sort((a, b) => b.time - a.time);
  }, [own, announcements, blockedIds, seenAt]);

  // Engellenen kişinin bildirimi görünmese de okunmamış kalmasın diye id listesi filtresizdir.
  const unreadIds = useMemo(() => (own ?? []).filter((n) => !n.read).map((n) => n.id), [own]);
  const unreadCount = loaded && !error ? items.filter((item) => item.unread).length : 0;

  return { items, unreadIds, unreadCount, loaded, error };
}
