import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { COLLECTIONS } from '@repo/shared';

import { db } from '@/firebase';

/**
 * Takip ilişkisi iki tarafta tutulur ve tek batch'te yazılır/silinir:
 *   users/{me}/following/{target}  ve  users/{target}/followers/{me}
 * firestore.rules ikisinin birlikte değiştiğini doğrular.
 */
export function followUser(me: string, target: string) {
  if (me === target) return Promise.resolve();
  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTIONS.users, me, 'following', target), { createdAt: serverTimestamp() });
  batch.set(doc(db, COLLECTIONS.users, target, 'followers', me), { createdAt: serverTimestamp() });
  return batch.commit();
}

export function unfollowUser(me: string, target: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.users, me, 'following', target));
  batch.delete(doc(db, COLLECTIONS.users, target, 'followers', me));
  return batch.commit();
}
