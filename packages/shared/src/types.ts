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

export type Coordinates = { latitude: number; longitude: number };

export type SponsorInfo = {
  /** Sponsor firmanın adı (ör. kafe zinciri). */
  name: string;
  /** Kullanıcıya gösterilecek kampanya/indirim metni. */
  offer?: string;
  url?: string;
};

/**
 * locations/{id} — yalnızca admin yazabilir (firestore.rules).
 * İlk sürümde eklenen mekanlarda name/description dışındaki alanlar olmayabilir.
 */
export type Location = {
  name: string;
  description: string;
  /** İlçe, ör. "Kadıköy". Keşfet'teki hızlı filtreler bunu kullanır. */
  district?: string;
  /** Ör. "Tarihi", "Müze", "Park", "Manzara", "Çarşı". */
  category?: string;
  coordinates?: Coordinates;
  /** 0–5 arası ortalama puan. */
  rating?: number;
  isFree?: boolean;
  isSponsored?: boolean;
  sponsorInfo?: SponsorInfo | null;
  /** Cloudinary'deki kapak fotoğrafı. */
  coverPhotoUrl?: string;
  /** Fotoğrafçı ve lisans, ör. "A.Savin · FAL" (lisans gereği gösterilir). */
  coverPhotoCredit?: string;
  /** Fotoğrafın kaynağı (Wikimedia Commons sayfası). */
  coverPhotoSource?: string;
};

/** check_ins/{id} */
export type CheckIn = {
  userId: string;
  locationId: string;
  locationName: string;
  note: string;
  /** POINTS_PER_CHECKIN ya da (24 saat içinde tekrar ise) 0. */
  points: number;
  /** Cloudinary'deki fotoğrafın adresi (https://res.cloudinary.com/...). */
  photoUrl?: string;
  /** Beğeni sayısı; check_ins/{id}/likes alt koleksiyonuyla aynı batch'te güncellenir. */
  likeCount?: number;
  createdAt: FirestoreTimestamp | null;
};

export type WithId<T> = T & { id: string };
