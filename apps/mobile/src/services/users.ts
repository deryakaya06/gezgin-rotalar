import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  COLLECTIONS,
  POINTS_PER_CHECKIN,
  searchKey,
  type AccountType,
  type UserProfile,
  type WithId,
} from '@repo/shared';

import { db } from '@/firebase';

export function createUserProfile(
  uid: string,
  data: { displayName: string; accountType: AccountType }
) {
  return setDoc(doc(db, COLLECTIONS.users, uid), {
    displayName: data.displayName,
    accountType: data.accountType,
    searchName: searchKey(data.displayName),
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
  const displayName: string = legacy.displayName ?? email?.split('@')[0] ?? 'Gezgin';
  const batch = writeBatch(db);

  batch.update(doc(db, COLLECTIONS.users, uid), {
    displayName,
    searchName: searchKey(displayName),
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

/** Arama alanı eksik ya da adla uyuşmuyorsa düzeltir (giriş yapan kullanıcı kendisi için). */
export function syncSearchName(uid: string, profile: UserProfile) {
  const expected = searchKey(profile.displayName);
  if (profile.searchName === expected) return null;
  return updateDoc(doc(db, COLLECTIONS.users, uid), { searchName: expected });
}

/** Görünen adı aranan metinle başlayan kullanıcılar (en fazla 20). */
export async function searchUsers(text: string): Promise<WithId<UserProfile>[]> {
  const q = searchKey(text);
  if (!q) return [];
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.users),
      where('searchName', '>=', q),
      where('searchName', '<=', q + '\uf8ff'),
      orderBy('searchName'),
      limit(20)
    )
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as UserProfile) }));
}

/** users/{uid}/followers veya following listesindeki kullanıcıların profilleri (en fazla 100). */
export async function fetchFollowList(
  uid: string,
  type: 'followers' | 'following'
): Promise<WithId<UserProfile>[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.users, uid, type), orderBy('createdAt', 'desc'), limit(100))
  );
  const profiles = await Promise.all(
    snapshot.docs.map((d) => getDoc(doc(db, COLLECTIONS.users, d.id)))
  );
  return profiles
    .filter((p) => p.exists())
    .map((p) => ({ id: p.id, ...(p.data() as UserProfile) }));
}

/** Profil fotoğrafını ayarlar; null verilirse kaldırır (hesap türü emojisine döner). */
export function setProfilePhoto(uid: string, photoUrl: string | null) {
  return updateDoc(doc(db, COLLECTIONS.users, uid), {
    photoUrl: photoUrl ?? deleteField(),
  });
}
