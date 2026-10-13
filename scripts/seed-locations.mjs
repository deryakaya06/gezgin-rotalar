// Başlangıç mekanlarını (scripts/locations.json) Firestore'a yazar.
// Her mekan sabit id ile yazılır; betik tekrar çalıştırılırsa kopya oluşmaz, kayıtlar güncellenir.
//
// Gereken: users/{uid} dokümanında role: "admin" alanı olan bir hesap (Firebase Console'dan eklenir).
// Kullanım (kök dizinden): npm run seed:locations   — e-posta ve şifre sorulur.
import { readFile } from 'node:fs/promises';

import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { openAdminSession } from './lib/admin-session.mjs';

const locations = JSON.parse(await readFile(new URL('./locations.json', import.meta.url), 'utf8'));

let session;
try {
  session = await openAdminSession();
  const batch = writeBatch(session.db);
  for (const { id, ...data } of locations) {
    batch.set(doc(session.db, 'locations', id), { ...data, updatedAt: serverTimestamp() });
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
  await session?.close();
}
