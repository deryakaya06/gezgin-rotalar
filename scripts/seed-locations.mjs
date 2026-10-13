// Başlangıç mekanlarını (scripts/locations.json) Firestore'a yazar.
// Her mekan sabit id ile yazılır; betik tekrar çalıştırılırsa kopya oluşmaz, kayıtlar güncellenir.
//
// Gereken: users/{uid} dokümanında role: "admin" alanı olan bir hesap (Firebase Console'dan eklenir).
// Kullanım (kök dizinden):
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-locations.mjs
import { readFile } from 'node:fs/promises';

import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  serverTimestamp,
  terminate,
  writeBatch,
} from 'firebase/firestore';

// apps/mobile/src/firebase.ts ile aynı (herkese açık istemci yapılandırması).
const firebaseConfig = {
  apiKey: 'AIzaSyDdjXGaCogNZqOsL8UEj9xg_JmbAs6FqHc',
  authDomain: 'gezgin-rotalar.firebaseapp.com',
  projectId: 'gezgin-rotalar',
};

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenlerini ver.');
  process.exit(1);
}

const locations = JSON.parse(await readFile(new URL('./locations.json', import.meta.url), 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// firebase emulators:exec altında çalışırsa gerçek veritabanı yerine emülatöre yazar.
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
    disableWarnings: true,
  });
  console.log('Emülatör kullanılıyor.');
}

try {
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);

  const batch = writeBatch(db);
  for (const { id, ...data } of locations) {
    batch.set(doc(db, 'locations', id), { ...data, updatedAt: serverTimestamp() });
  }
  await batch.commit();
  console.log(`✔ ${locations.length} mekan yazıldı.`);
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error(
      '✖ Yetki yok. Bu hesabın users/{uid} dokümanına Firebase Console\'dan role: "admin" ekle ' +
        've güncel kuralların yayında olduğundan emin ol (firebase deploy --only firestore).'
    );
  } else {
    console.error('✖', error.message);
  }
  process.exitCode = 1;
} finally {
  await signOut(auth).catch(() => {});
  await terminate(db);
  await deleteApp(app);
}
