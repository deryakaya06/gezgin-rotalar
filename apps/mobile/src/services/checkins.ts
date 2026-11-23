import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  COLLECTIONS,
  DUPLICATE_CHECKIN_WINDOW_HOURS,
  POINTS_PER_CHECKIN,
  type CheckIn,
  type Visit,
  type WithId,
} from '@repo/shared';

import { db } from '@/firebase';

/**
 * Check-in'i, kullanıcının puan/ziyaret sayacını ve (puan verildiyse) mekanın
 * visits kaydını tek batch'te yazar. firestore.rules bu üçünün tutarlı olduğunu
 * ve 24 saat kuralını doğrular. Kazanılan puanı döndürür.
 */
export async function createCheckIn(
  uid: string,
  location: { id: string; name: string },
  note: string,
  photoUrl?: string,
  /** Etiketlenen kişiler; her birine aynı batch'te bildirim gider. */
  tags?: { actorName: string; userIds: string[] }
) {
  const visitRef = doc(db, COLLECTIONS.users, uid, 'visits', location.id);
  const visit = await getDoc(visitRef);
  const lastAwardedAt = visit.exists() ? (visit.data() as Visit).lastAwardedAt.toDate() : null;
  const windowMs = DUPLICATE_CHECKIN_WINDOW_HOURS * 60 * 60 * 1000;
  const points =
    !lastAwardedAt || Date.now() - lastAwardedAt.getTime() >= windowMs ? POINTS_PER_CHECKIN : 0;

  const checkInRef = doc(collection(db, COLLECTIONS.checkIns));
  const batch = writeBatch(db);

  batch.set(checkInRef, {
    userId: uid,
    locationId: location.id,
    locationName: location.name,
    note,
    points,
    createdAt: serverTimestamp(),
    ...(photoUrl ? { photoUrl } : {}),
    ...(tags?.userIds.length ? { taggedUserIds: tags.userIds } : {}),
  });
  batch.update(doc(db, COLLECTIONS.users, uid), {
    totalPoints: increment(points),
    visitCount: increment(1),
    lastCheckInId: checkInRef.id,
  });
  if (points > 0) {
    batch.set(visitRef, { lastAwardedAt: serverTimestamp(), checkInId: checkInRef.id });
  }

  for (const taggedId of tags?.userIds ?? []) {
    batch.set(doc(db, COLLECTIONS.users, taggedId, 'notifications', `tag_${checkInRef.id}`), {
      type: 'tag',
      actorId: uid,
      actorName: tags!.actorName,
      targetId: checkInRef.id,
      targetName: location.name,
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return points;
}

/**
 * Kendi check-in'ini siler; aynı batch'te kazanılan puan ve ziyaret geri alınır.
 * firestore.rules miktarların doğruluğunu denetler. visits kaydı silinmez; böylece
 * silip tekrar check-in yapmak 24 saat içinde yeniden puan getirmez.
 */
export function deleteCheckIn(uid: string, checkIn: { id: string; points?: number }) {
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.checkIns, checkIn.id));
  batch.update(doc(db, COLLECTIONS.users, uid), {
    totalPoints: increment(-(checkIn.points ?? 0)),
    visitCount: increment(-1),
    lastDeletedCheckInId: checkIn.id,
  });
  return batch.commit();
}

/** Bir kullanıcının verilen gündeki ("2026-11-23", cihaz saatine göre) check-in'leri. */
export async function fetchDayCheckIns(uid: string, day: string): Promise<WithId<CheckIn>[]> {
  const [year, month, date] = day.split('-').map(Number);
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.checkIns),
      where('userId', '==', uid),
      where('createdAt', '>=', new Date(year, month - 1, date)),
      where('createdAt', '<', new Date(year, month - 1, date + 1)),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as CheckIn) }));
}
