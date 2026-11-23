import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { COLLECTIONS, type SuggestedLocation, type UserProfile, type WithId } from '@repo/shared';

import { auth, db } from '@/lib/firebase';
import { slugify } from '@/lib/locations';

export async function fetchPendingSuggestions(): Promise<WithId<SuggestedLocation>[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.suggestedLocations), where('status', '==', 'pending'))
  );
  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as SuggestedLocation) }))
    .sort((a, b) => b.voteCount - a.voteCount);
}

async function reviewerNotification(suggestion: WithId<SuggestedLocation>, approved: boolean) {
  const uid = auth.currentUser!.uid;
  const me = await getDoc(doc(db, COLLECTIONS.users, uid));
  return {
    type: approved ? 'suggestion_approved' : 'suggestion_rejected',
    actorId: uid,
    actorName: (me.data() as UserProfile).displayName,
    targetId: suggestion.id,
    targetName: suggestion.name,
    read: false,
    createdAt: serverTimestamp(),
  };
}

/**
 * Öneriyi onaylar: mekanı oluşturur, öneriyi kapatır ve sahibine haber verir (tek batch).
 * Konum ve kapak fotoğrafı öneride yoktur; mekan listede "eksik bilgili" görünür.
 * Oluşan mekanın id'sini döndürür.
 */
export async function approveSuggestion(suggestion: WithId<SuggestedLocation>) {
  const base = slugify(suggestion.name) || 'mekan';
  let locationId = base;
  for (let n = 2; (await getDoc(doc(db, COLLECTIONS.locations, locationId))).exists(); n++) {
    locationId = `${base}-${n}`;
  }

  const notification = await reviewerNotification(suggestion, true);
  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTIONS.locations, locationId), {
    name: suggestion.name,
    description: suggestion.description,
    district: suggestion.district,
    category: suggestion.category,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, COLLECTIONS.suggestedLocations, suggestion.id), { status: 'approved' });
  batch.set(
    doc(db, COLLECTIONS.users, suggestion.userId, 'notifications', `suggestion_${suggestion.id}`),
    notification
  );
  await batch.commit();
  return locationId;
}

export async function rejectSuggestion(suggestion: WithId<SuggestedLocation>) {
  const notification = await reviewerNotification(suggestion, false);
  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.suggestedLocations, suggestion.id), { status: 'rejected' });
  batch.set(
    doc(db, COLLECTIONS.users, suggestion.userId, 'notifications', `suggestion_${suggestion.id}`),
    notification
  );
  await batch.commit();
}
