export const COLLECTIONS = {
  users: 'users',
  locations: 'locations',
  checkIns: 'check_ins',
  plannedTrips: 'planned_trips',
  suggestedLocations: 'suggested_locations',
  reports: 'reports',
  announcements: 'announcements',
} as const;

/** firestore.rules içindeki pointsPerCheckIn() ile aynı olmalı. */
export const POINTS_PER_CHECKIN = 10;

/** Aynı mekana bu süre içinde yapılan ikinci check-in puan kazandırmaz (firestore.rules uygular). */
export const DUPLICATE_CHECKIN_WINDOW_HOURS = 24;

/** Mekan kategorileri; öneri kuralı için firestore.rules içindeki listeyle aynı olmalı. */
export const LOCATION_CATEGORIES = ['Tarihi', 'Müze', 'Park', 'Manzara', 'Çarşı', 'Sokak', 'Ada', 'Lezzet'] as const;

/** Şikâyet nedenleri; anahtarlar firestore.rules içindeki listeyle aynı olmalı. */
export const REPORT_REASONS = {
  spam: 'Spam',
  inappropriate: 'Uygunsuz içerik',
  fake: 'Yanıltıcı veya sahte',
  other: 'Diğer',
} as const;

/** Bir check-in'de etiketlenebilecek en fazla kişi; firestore.rules aynı sınırı uygular. */
export const MAX_CHECKIN_TAGS = 5;

/** Bir gezi planındaki en fazla durak; firestore.rules aynı sınırı uygular. */
export const MAX_TRIP_STOPS = 10;

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
