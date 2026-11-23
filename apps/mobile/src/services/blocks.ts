import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { COLLECTIONS } from '@repo/shared';

import { db } from '@/firebase';

/** Kullanıcıyı engeller ve aynı batch'te iki yöndeki takibi de kaldırır. */
export function blockUser(me: string, target: string) {
  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTIONS.users, me, 'blocked', target), { createdAt: serverTimestamp() });
  batch.delete(doc(db, COLLECTIONS.users, me, 'following', target));
  batch.delete(doc(db, COLLECTIONS.users, target, 'followers', me));
  batch.delete(doc(db, COLLECTIONS.users, target, 'following', me));
  batch.delete(doc(db, COLLECTIONS.users, me, 'followers', target));
  // Kalan takip bildirimi, engel kalkınca yeniden takip etmeyi engellemesin.
  batch.delete(doc(db, COLLECTIONS.users, me, 'notifications', `follow_${target}`));
  batch.delete(doc(db, COLLECTIONS.users, target, 'notifications', `follow_${me}`));
  return batch.commit();
}

export function unblockUser(me: string, target: string) {
  return deleteDoc(doc(db, COLLECTIONS.users, me, 'blocked', target));
}

export function subscribeBlockedIds(
  uid: string,
  onData: (ids: string[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTIONS.users, uid, 'blocked'),
    (snapshot) => onData(snapshot.docs.map((d) => d.id)),
    onError
  );
}
