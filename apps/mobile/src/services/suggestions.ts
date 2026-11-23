import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { COLLECTIONS, type SuggestedLocation, type WithId } from '@repo/shared';

import { db } from '@/firebase';

export function createSuggestion(
  uid: string,
  userName: string,
  data: Pick<SuggestedLocation, 'name' | 'district' | 'category' | 'description'>
) {
  return setDoc(doc(collection(db, COLLECTIONS.suggestedLocations)), {
    ...data,
    userId: uid,
    userName,
    status: 'pending',
    voteCount: 0,
    createdAt: serverTimestamp(),
  });
}

export function deleteSuggestion(id: string) {
  return deleteDoc(doc(db, COLLECTIONS.suggestedLocations, id));
}

/** Bekleyen önerileri canlı dinler; en çok oy alan önce, eşitlikte en yeni önce. */
export function subscribePendingSuggestions(
  onData: (items: WithId<SuggestedLocation>[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, COLLECTIONS.suggestedLocations), where('status', '==', 'pending')),
    (snapshot) => {
      const time = (item: SuggestedLocation) => item.createdAt?.toDate?.().getTime() ?? Date.now();
      onData(
        snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as SuggestedLocation) }))
          .sort((a, b) => b.voteCount - a.voteCount || time(b) - time(a))
      );
    },
    onError
  );
}

export async function hasVoted(uid: string, suggestionId: string) {
  const snap = await getDoc(doc(db, COLLECTIONS.suggestedLocations, suggestionId, 'votes', uid));
  return snap.exists();
}

/**
 * Oy kaydı ve voteCount tek batch'te değişir; firestore.rules ikisinin birlikte
 * ve yalnızca ±1 değiştiğini doğrular.
 */
export function setVote(uid: string, suggestionId: string, vote: boolean) {
  const batch = writeBatch(db);
  const voteRef = doc(db, COLLECTIONS.suggestedLocations, suggestionId, 'votes', uid);
  if (vote) batch.set(voteRef, { createdAt: serverTimestamp() });
  else batch.delete(voteRef);
  batch.update(doc(db, COLLECTIONS.suggestedLocations, suggestionId), {
    voteCount: increment(vote ? 1 : -1),
  });
  return batch.commit();
}
