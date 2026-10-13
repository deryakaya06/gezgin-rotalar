export const COLLECTIONS = {
  users: 'users',
  locations: 'locations',
  checkIns: 'check_ins',
  plannedTrips: 'planned_trips',
  suggestedLocations: 'suggested_locations',
  reports: 'reports',
} as const;

/** firestore.rules içindeki pointsPerCheckIn() ile aynı olmalı. */
export const POINTS_PER_CHECKIN = 10;

/** Aynı mekana bu süre içinde yapılan ikinci check-in puan kazandırmaz (firestore.rules uygular). */
export const DUPLICATE_CHECKIN_WINDOW_HOURS = 24;

/**
 * Check-in fotoğrafları Cloudinary'de tutulur (Firebase Storage Spark planında yok).
 * İkisi de gizli değildir: imzasız yükleme ayarı istemcide bulunmak zorundadır.
 * cloudName firestore.rules içindeki cloudinaryCloudName() ile aynı olmalı.
 */
export const CLOUDINARY = {
  cloudName: 'lgk3ljrv',
  uploadPreset: 'gezgin-checkin',
} as const;
