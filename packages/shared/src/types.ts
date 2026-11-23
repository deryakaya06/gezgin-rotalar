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
  /** searchKey(displayName); kullanıcı araması için. */
  searchName?: string;
  /** Cloudinary'deki profil fotoğrafı; yoksa hesap türü emojisi gösterilir. */
  photoUrl?: string;
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
  /** Check-in'de etiketlenen, paylaşanın takip ettiği kişiler. */
  taggedUserIds?: string[];
  createdAt: FirestoreTimestamp | null;
};

/** planned_trips/{id} — yalnızca sahibi görür. date "2026-11-23" biçiminde. */
export type PlannedTrip = {
  userId: string;
  title: string;
  date: string;
  /** Duraklar gidiş sırasında. */
  locationIds: string[];
  locationNames: string[];
  note: string;
  createdAt: FirestoreTimestamp | null;
};

export type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'other';

/** reports/{checkInId}_{reporterId} — kişi başına bir şikâyet; yalnızca admin okur. */
export type Report = {
  reporterId: string;
  checkInId: string;
  reason: ReportReason;
  createdAt: FirestoreTimestamp | null;
};

/**
 * suggested_locations/{id} — kullanıcıların önerdiği mekanlar. Oylar
 * suggested_locations/{id}/votes/{uid} altında; voteCount aynı batch'te güncellenir.
 */
export type SuggestedLocation = {
  userId: string;
  userName: string;
  name: string;
  district: string;
  category: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  voteCount: number;
  createdAt: FirestoreTimestamp | null;
};

export type NotificationType = 'follow' | 'tag' | 'suggestion_approved' | 'suggestion_rejected';

/**
 * users/{uid}/notifications/{id} — yalnızca sahibi okur. id tekrarı önler:
 * follow_{actorId}, tag_{checkInId}, suggestion_{suggestionId}.
 */
export type AppNotification = {
  type: NotificationType;
  actorId: string;
  actorName: string;
  /** tag: check-in id, suggestion_*: öneri id, follow: boş. */
  targetId: string;
  /** tag: mekan adı, suggestion_*: önerilen mekanın adı, follow: boş. */
  targetName: string;
  read: boolean;
  createdAt: FirestoreTimestamp | null;
};

/** announcements/{id} — admin'in sponsorlu mekan duyurusu; bütün üyeler görür. */
export type Announcement = {
  title: string;
  body: string;
  locationId: string;
  locationName: string;
  createdAt: FirestoreTimestamp | null;
};

export type WithId<T> = T & { id: string };
