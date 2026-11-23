import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  COLLECTIONS,
  type Announcement,
  type AppNotification,
  type FirestoreTimestamp,
  type WithId,
} from '@repo/shared';

import { db } from '@/firebase';

const NOTIFICATION_LIMIT = 50;
const ANNOUNCEMENT_LIMIT = 20;

export function subscribeNotifications(
  uid: string,
  onData: (items: WithId<AppNotification>[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(
      collection(db, COLLECTIONS.users, uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(NOTIFICATION_LIMIT)
    ),
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as AppNotification) }))),
    onError
  );
}

export function subscribeAnnouncements(
  onData: (items: WithId<Announcement>[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, COLLECTIONS.announcements), orderBy('createdAt', 'desc'), limit(ANNOUNCEMENT_LIMIT)),
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Announcement) }))),
    onError
  );
}

/** Duyuruların en son görüldüğü zaman; hiç görülmediyse null. */
export function subscribeAnnouncementsSeenAt(
  uid: string,
  onData: (seenAt: FirestoreTimestamp | null) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    doc(db, COLLECTIONS.users, uid, 'notification_state', 'announcements'),
    (snap) => onData((snap.data()?.lastSeenAt as FirestoreTimestamp | undefined) ?? null),
    onError
  );
}

/** Verilen bildirimleri okundu yapar ve duyuruları görülmüş sayar. */
export function markNotificationsSeen(uid: string, unreadIds: string[]) {
  const batch = writeBatch(db);
  for (const id of unreadIds) {
    batch.update(doc(db, COLLECTIONS.users, uid, 'notifications', id), { read: true });
  }
  batch.set(doc(db, COLLECTIONS.users, uid, 'notification_state', 'announcements'), {
    lastSeenAt: serverTimestamp(),
  });
  return batch.commit();
}
