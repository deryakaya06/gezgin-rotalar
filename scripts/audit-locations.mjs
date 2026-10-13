// Firestore'daki mekanlardan konum/ilçe gibi alanları eksik olanları listeler ve
// scripts/locations.json'daki bir mekanla aynı ada sahip olanları (kopyaları) işaretler.
// Hiçbir şeyi değiştirmez, yalnızca okur.
//
// Kullanım (kök dizinden):
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run locations:audit
import { readFile } from 'node:fs/promises';

import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, getFirestore, terminate } from 'firebase/firestore';

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

const seeded = JSON.parse(await readFile(new URL('./locations.json', import.meta.url), 'utf8'));
const normalize = (s) => s.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
const seededByName = new Map(seeded.map((l) => [normalize(l.name), l.id]));
const REQUIRED = ['district', 'category', 'coordinates', 'coverPhotoUrl'];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  const snapshot = await getDocs(collection(db, 'locations'));
  const incomplete = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((l) => REQUIRED.some((field) => !l[field]));

  console.log(`Toplam ${snapshot.size} mekan, ${incomplete.length} tanesinde eksik alan var.\n`);
  for (const l of incomplete) {
    const missing = REQUIRED.filter((field) => !l[field]).join(', ');
    const copyOf = seededByName.get(normalize(l.name ?? ''));
    console.log(`- ${l.id} | "${l.name}" | eksik: ${missing}` + (copyOf ? ` | KOPYA (asıl kayıt: ${copyOf})` : ''));
  }
} catch (error) {
  console.error('✖', error.message);
  process.exitCode = 1;
} finally {
  await signOut(auth).catch(() => {});
  await terminate(db);
  await deleteApp(app);
}
