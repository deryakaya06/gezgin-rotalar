import { collection, doc, getDoc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  COLLECTIONS,
  DUPLICATE_CHECKIN_WINDOW_HOURS,
  POINTS_PER_CHECKIN,
  type Visit,
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
  note: string
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
  });
  batch.update(doc(db, COLLECTIONS.users, uid), {
    totalPoints: increment(points),
    visitCount: increment(1),
    lastCheckInId: checkInRef.id,
  });
  if (points > 0) {
    batch.set(visitRef, { lastAwardedAt: serverTimestamp(), checkInId: checkInRef.id });
  }

  await batch.commit();
  return points;
}
