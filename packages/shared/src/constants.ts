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

/** Firebase istemci yapılandırması (gizli değil); mobil uygulama ve admin paneli ortak kullanır. */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDdjXGaCogNZqOsL8UEj9xg_JmbAs6FqHc',
  authDomain: 'gezgin-rotalar.firebaseapp.com',
  projectId: 'gezgin-rotalar',
  storageBucket: 'gezgin-rotalar.firebasestorage.app',
  messagingSenderId: '635324784027',
  appId: '1:635324784027:web:6fe2a246c26a330338d53e',
} as const;
