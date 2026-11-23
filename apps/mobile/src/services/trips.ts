import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type PlannedTrip, type WithId } from '@repo/shared';

import { db } from '@/firebase';

export function createPlannedTrip(
  uid: string,
  trip: Pick<PlannedTrip, 'title' | 'date' | 'locationIds' | 'locationNames' | 'note'>
) {
  return setDoc(doc(collection(db, COLLECTIONS.plannedTrips)), {
    ...trip,
    userId: uid,
    createdAt: serverTimestamp(),
  });
}

export function deletePlannedTrip(id: string) {
  return deleteDoc(doc(db, COLLECTIONS.plannedTrips, id));
}

/** Kullanıcının planlarını canlı dinler. */
export function subscribePlannedTrips(
  uid: string,
  onData: (trips: WithId<PlannedTrip>[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, COLLECTIONS.plannedTrips), where('userId', '==', uid)),
    (snapshot) => {
      onData(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PlannedTrip) })));
    },
    onError
  );
}
