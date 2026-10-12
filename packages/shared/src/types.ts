/**
 * Firestore veri modeli. Mobil uygulama ve web admin paneli bu tipleri ortak kullanır.
 * Zaman alanları Firestore Timestamp'tir; paket Firebase'e bağımlı olmasın diye
 * yalnızca kullanılan yüzeyi tanımlıyoruz.
 */
export type FirestoreTimestamp = { toDate(): Date };

export type AccountType = 'couple' | 'friends';

/**
 * users/{uid} — herkese açık profil. Email burada tutulmaz, Auth'ta kalır.
 * Takipçi/takip sayıları alan olarak tutulmaz; followers/following alt
 * koleksiyonlarından count() ile hesaplanır.
 */
export type UserProfile = {
  displayName: string;
  accountType: AccountType;
  totalPoints: number;
  visitCount: number;
  createdAt: FirestoreTimestamp | null;
  /** Son check-in'in id'si; kuralların puan artışını doğrulaması için. */
  lastCheckInId?: string;
};

/** users/{uid}/visits/{locationId} — mekandan en son puan alınan zaman. */
export type Visit = {
  lastAwardedAt: FirestoreTimestamp;
  checkInId: string;
};

/** locations/{id} */
export type Location = {
  name: string;
  description: string;
  isSponsored?: boolean;
  sponsorInfo?: { name: string; url?: string } | null;
};

/** check_ins/{id} */
export type CheckIn = {
  userId: string;
  locationId: string;
  locationName: string;
  note: string;
  /** POINTS_PER_CHECKIN ya da (24 saat içinde tekrar ise) 0. */
  points: number;
  createdAt: FirestoreTimestamp | null;
};

export type WithId<T> = T & { id: string };
