import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { COLLECTIONS, type ReportReason } from '@repo/shared';

import { db } from '@/firebase';

/** Belge id'si checkInId_uid olduğu için kişi aynı paylaşımı ikinci kez şikâyet edemez. */
export function reportCheckIn(uid: string, checkInId: string, reason: ReportReason) {
  return setDoc(doc(db, COLLECTIONS.reports, `${checkInId}_${uid}`), {
    reporterId: uid,
    checkInId,
    reason,
    createdAt: serverTimestamp(),
  });
}
