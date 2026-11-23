import { doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { COLLECTIONS } from '@repo/shared';

import { db } from '@/firebase';

/**
 * Beğeni kaydı (check_ins/{id}/likes/{uid}) ve check-in'deki likeCount tek batch'te
 * değişir; firestore.rules ikisinin birlikte ve yalnızca ±1 değiştiğini doğrular.
 */
export function likeCheckIn(uid: string, checkInId: string) {
  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTIONS.checkIns, checkInId, 'likes', uid), { createdAt: serverTimestamp() });
  batch.update(doc(db, COLLECTIONS.checkIns, checkInId), { likeCount: increment(1) });
  return batch.commit();
}

export function unlikeCheckIn(uid: string, checkInId: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.checkIns, checkInId, 'likes', uid));
  batch.update(doc(db, COLLECTIONS.checkIns, checkInId), { likeCount: increment(-1) });
  return batch.commit();
}
