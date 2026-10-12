import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { COLLECTIONS, POINTS_PER_CHECKIN, type AccountType } from '@repo/shared';

import { db } from '@/firebase';

export function createUserProfile(
  uid: string,
  data: { displayName: string; accountType: AccountType }
) {
  return setDoc(doc(db, COLLECTIONS.users, uid), {
    displayName: data.displayName,
    accountType: data.accountType,
    totalPoints: 0,
    visitCount: 0,
    createdAt: serverTimestamp(),
  });
}

/**
 * Eski şemadaki (points, email) bir profili yeni şemaya taşır. firestore.rules bu
 * güncellemeye yalnızca bir kez ve totalPoints eski points değerine eşitse izin verir.
 * Eski takiplerin eksik followers kayıtları da tamamlanır.
 */
export async function migrateLegacyProfile(
  uid: string,
  email: string | null,
  legacy: Record<string, any>
) {
  const legacyPoints: number = legacy.points ?? 0;
  const batch = writeBatch(db);

  batch.update(doc(db, COLLECTIONS.users, uid), {
    displayName: legacy.displayName ?? email?.split('@')[0] ?? 'Gezgin',
    accountType: legacy.accountType === 'couple' ? 'couple' : 'friends',
    totalPoints: legacyPoints,
    visitCount: Math.floor(legacyPoints / POINTS_PER_CHECKIN),
    points: deleteField(),
    email: deleteField(),
  });

  const following = await getDocs(collection(db, COLLECTIONS.users, uid, 'following'));
  for (const f of following.docs) {
    const target = await getDoc(doc(db, COLLECTIONS.users, f.id));
    if (target.exists()) {
      batch.set(doc(db, COLLECTIONS.users, f.id, 'followers', uid), {
        createdAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
}
