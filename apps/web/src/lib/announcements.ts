import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { COLLECTIONS, type Announcement, type WithId } from '@repo/shared';

import { db } from '@/lib/firebase';

export async function fetchAnnouncements(): Promise<WithId<Announcement>[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.announcements), orderBy('createdAt', 'desc'), limit(50))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Announcement) }));
}

export function createAnnouncement(data: Pick<Announcement, 'title' | 'body' | 'locationId' | 'locationName'>) {
  return addDoc(collection(db, COLLECTIONS.announcements), { ...data, createdAt: serverTimestamp() });
}

export function deleteAnnouncement(id: string) {
  return deleteDoc(doc(db, COLLECTIONS.announcements, id));
}
